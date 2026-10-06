<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * CRUD des rôles (routes admin /api/roles) : création, unicité du nom et du slug,
 * protection du rôle système administrateur, suppression conditionnée.
 */
class RoleCrudTest extends TestCase
{
    use RefreshDatabase;

    private Role $adminRole;

    private Role $userRole;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminRole = Role::create(['name' => 'Administrateur', 'slug' => Role::SLUG_ADMIN]);
        $this->userRole = Role::create(['name' => 'Utilisateur', 'slug' => 'utilisateur']);

        $this->admin = $this->makeUser('ADMIN001', $this->adminRole);
    }

    /**
     * Mot de passe différent du mot de passe initial, sinon le middleware password.changed bloque
     */
    private function makeUser(string $matricule, ?Role $role): User
    {
        return User::create([
            'matricule' => $matricule,
            'nom' => 'TEST',
            'prenom' => $matricule,
            'email' => strtolower($matricule).'@sbee.bj',
            'password' => Hash::make('Admin@2024'),
            'role_id' => $role?->id,
            'is_active' => true,
        ]);
    }

    private function makeApplication(string $name): Application
    {
        $category = Category::firstOrCreate(['name' => 'Gestion']);

        return Application::create([
            'name' => $name,
            'url' => 'https://'.strtolower($name).'.sbee.bj',
            'category_id' => $category->id,
            'deployment_date' => '2024-01-01',
            'developed_by' => 'DSI',
        ]);
    }

    public function test_creation_avec_applications(): void
    {
        $app1 = $this->makeApplication('Paie');
        $app2 = $this->makeApplication('Stock');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/roles', [
            'name' => 'Chef de Projet',
            'description' => 'Pilotage',
            'application_ids' => [$app1->id, $app2->id],
        ])
            ->assertStatus(201)
            ->assertJsonPath('message', 'Rôle créé.')
            ->assertJsonPath('role.name', 'Chef de Projet')
            ->assertJsonPath('role.slug', 'chef-de-projet')
            ->assertJsonPath('role.description', 'Pilotage')
            ->assertJsonPath('role.is_system', false)
            ->assertJsonPath('role.users_count', 0)
            ->assertJsonCount(2, 'role.applications');

        $role = Role::where('slug', 'chef-de-projet')->firstOrFail();
        $this->assertEqualsCanonicalizing([$app1->id, $app2->id], $role->applications()->pluck('applications.id')->all());
        $this->assertDatabaseHas('activity_logs', ['action' => 'create_role', 'user_id' => $this->admin->id]);
    }

    public function test_index_expose_is_system(): void
    {
        Sanctum::actingAs($this->admin);

        $roles = collect($this->getJson('/api/roles')->assertOk()->json('data'))->keyBy('slug');

        $this->assertTrue($roles['administrateur']['is_system']);
        $this->assertFalse($roles['utilisateur']['is_system']);
        $this->assertSame(1, $roles['administrateur']['users_count']);
    }

    public function test_nom_en_double_refuse(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/roles', ['name' => 'Utilisateur'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name' => 'Ce rôle existe déjà.']);
    }

    public function test_nom_similaire_refuse(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/roles', ['name' => 'utilisateur!'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name' => 'Un rôle portant un nom similaire existe déjà.']);

        $other = Role::create(['name' => 'Comptable']);

        $this->putJson("/api/roles/{$other->id}", ['name' => 'UTILISATEUR !'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name' => 'Un rôle portant un nom similaire existe déjà.']);
    }

    public function test_mise_a_jour_regenere_le_slug(): void
    {
        $role = Role::create(['name' => 'Comptable']);
        $this->assertSame('comptable', $role->slug);
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/roles/{$role->id}", ['name' => 'Comptable Principal', 'description' => 'Finances'])
            ->assertOk()
            ->assertJsonPath('message', 'Rôle mis à jour.')
            ->assertJsonPath('role.slug', 'comptable-principal')
            ->assertJsonPath('role.description', 'Finances');

        $this->assertSame('comptable-principal', $role->fresh()->slug);
        $this->assertDatabaseHas('activity_logs', ['action' => 'update_role']);
    }

    public function test_role_admin_slug_inchange_et_non_supprimable(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/roles/{$this->adminRole->id}", ['name' => 'Super Admin', 'description' => 'Tout'])
            ->assertOk()
            ->assertJsonPath('role.name', 'Super Admin')
            ->assertJsonPath('role.slug', Role::SLUG_ADMIN)
            ->assertJsonPath('role.is_system', true);

        $this->assertSame(Role::SLUG_ADMIN, $this->adminRole->fresh()->slug);
        $this->assertTrue($this->admin->fresh()->isAdmin());

        $this->deleteJson("/api/roles/{$this->adminRole->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Le rôle administrateur est un rôle système : il ne peut pas être supprimé.');

        $this->assertDatabaseHas('roles', ['id' => $this->adminRole->id]);
    }

    public function test_suppression_refusee_si_utilisateurs(): void
    {
        $this->makeUser('USER001', $this->userRole);
        $this->makeUser('USER002', $this->userRole);
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/roles/{$this->userRole->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', '2 utilisateur(s) ont ce rôle. Attribuez-leur un autre rôle avant de le supprimer.');

        $this->assertDatabaseHas('roles', ['id' => $this->userRole->id]);
    }

    public function test_suppression_ok_vide_le_pivot(): void
    {
        $app = $this->makeApplication('Paie');
        $role = Role::create(['name' => 'Temporaire']);
        $role->applications()->sync([$app->id]);
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/roles/{$role->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Rôle supprimé.');

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
        $this->assertSame(0, DB::table('application_role')->where('role_id', $role->id)->count());
        $this->assertDatabaseHas('applications', ['id' => $app->id]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'delete_role']);
    }

    public function test_non_admin_interdit(): void
    {
        Sanctum::actingAs($this->makeUser('USER001', $this->userRole));

        $this->postJson('/api/roles', ['name' => 'Pirate'])->assertStatus(403);
        $this->putJson("/api/roles/{$this->userRole->id}", ['name' => 'Pirate'])->assertStatus(403);
        $this->deleteJson("/api/roles/{$this->userRole->id}")->assertStatus(403);

        $this->assertDatabaseMissing('roles', ['name' => 'Pirate']);
    }
}
