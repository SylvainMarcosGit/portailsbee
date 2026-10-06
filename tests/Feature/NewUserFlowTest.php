<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Parcours « nouvel utilisateur » : recherche RH, création avec mot de passe
 * initial, blocage tant qu'il n'est pas changé, réinitialisation par l'admin.
 * L'API RH (JD Edwards) est entièrement simulée via Http::fake.
 */
class NewUserFlowTest extends TestCase
{
    use RefreshDatabase;

    private const JDE = 'https://jde.test/jderest';

    private Role $adminRole;

    private Role $userRole;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.jde.endpoint' => self::JDE,
            'services.jde.username' => 'test',
            'services.jde.password' => 'test',
            'services.jde.environnement' => 'TEST',
            'services.jde.role' => '*ALL',
        ]);
        Cache::flush();

        $this->adminRole = Role::create(['name' => 'Administrateur', 'slug' => 'administrateur']);
        $this->userRole = Role::create(['name' => 'Utilisateur', 'slug' => 'utilisateur']);

        $this->admin = User::create([
            'matricule' => 'ADMIN001',
            'nom' => 'ADMIN',
            'prenom' => 'Système',
            'email' => 'admin@sbee.bj',
            'password' => Hash::make('Admin@2024'),
            'role_id' => $this->adminRole->id,
            'is_active' => true,
        ]);
    }

    /**
     * Simule l'API RH : jeton + orchestrateur employé (seul le matricule 12345 existe).
     */
    private function fakeRh(): void
    {
        Http::fake([
            self::JDE.'/tokenrequest' => Http::response(['userInfo' => ['token' => 'jeton-test']]),
            self::JDE.'/orchestrator/ORCH_WS_EMPLOYEE' => function (HttpRequest $request) {
                if ($request['Address_Number'] === '112345') {
                    return Http::response([
                        'FR_WS_EMPLOYE_1' => [
                            'records' => 1,
                            'rowset' => [[
                                'prenom' => 'Afi',
                                'nom' => 'HOUNSOU',
                                'titre_de_poste' => 'Ingénieur réseau',
                                'direction' => 'Direction des Systèmes d\'Information',
                            ]],
                        ],
                    ]);
                }

                return Http::response(['FR_WS_EMPLOYE_1' => ['records' => 0, 'rowset' => []]]);
            },
        ]);
    }

    private function tokenFor(User $user): string
    {
        return $user->createToken('auth_token')->plainTextToken;
    }

    /**
     * Requête JSON authentifiée par un vrai jeton Sanctum (garde réinitialisée à chaque appel).
     */
    private function api(string $method, string $uri, string $token, array $data = [])
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->json($method, $uri, $data);
    }

    public function test_recherche_employe_trouve(): void
    {
        $this->fakeRh();

        $this->api('GET', '/api/admin/employes/12345', $this->tokenFor($this->admin))
            ->assertOk()
            ->assertExactJson([
                'employe' => [
                    'matricule' => '12345',
                    'prenom' => 'Afi',
                    'nom' => 'HOUNSOU',
                    'titre_de_poste' => 'Ingénieur réseau',
                    'direction' => 'Direction des Systèmes d\'Information',
                ],
            ]);

        Http::assertSent(fn (HttpRequest $r) => str_ends_with($r->url(), '/orchestrator/ORCH_WS_EMPLOYEE')
            && $r['Address_Number'] === '112345'
            && $r['token'] === 'jeton-test');
    }

    public function test_recherche_employe_introuvable_404(): void
    {
        $this->fakeRh();

        $this->api('GET', '/api/admin/employes/99999', $this->tokenFor($this->admin))
            ->assertNotFound()
            ->assertJson(['message' => 'Aucun employé trouvé avec le matricule : 99999']);
    }

    public function test_recherche_employe_serveur_injoignable_503(): void
    {
        Http::fake([
            self::JDE.'/*' => Http::failedConnection(),
        ]);

        $this->api('GET', '/api/admin/employes/12345', $this->tokenFor($this->admin))
            ->assertStatus(503)
            ->assertJson(['message' => 'Serveur RH SBEE injoignable. Réessayez dans un instant.']);
    }

    public function test_recherche_employe_non_configuree_503(): void
    {
        config(['services.jde.endpoint' => null]);
        Http::fake();

        $this->api('GET', '/api/admin/employes/12345', $this->tokenFor($this->admin))
            ->assertStatus(503)
            ->assertJson(['message' => 'Recherche RH non configurée (JDE_API_ENDPOINT).']);

        Http::assertNothingSent();
    }

    public function test_recherche_employe_deja_inscrit_409(): void
    {
        Http::fake();

        $this->api('GET', '/api/admin/employes/ADMIN001', $this->tokenFor($this->admin))
            ->assertStatus(409)
            ->assertJson(['message' => 'Un compte existe déjà pour ce matricule.']);

        Http::assertNothingSent();
    }

    public function test_creation_utilisateur_depuis_le_rh(): void
    {
        $this->fakeRh();

        $response = $this->api('POST', '/api/admin/users', $this->tokenFor($this->admin), [
            'matricule' => '12345',
            'nom' => 'IGNORE',
            'prenom' => 'IGNORE',
            'password' => 'ne-doit-pas-servir',
            'telephone' => '0197000000',
            'role_id' => $this->userRole->id,
        ]);

        $response->assertCreated()
            ->assertJson([
                'message' => 'Utilisateur créé. Mot de passe initial : 12345@SBEE - à changer à la première connexion.',
                'user' => [
                    'matricule' => '12345',
                    'nom' => 'HOUNSOU',
                    'prenom' => 'Afi',
                    'email' => null,
                    'telephone' => '0197000000',
                    'direction' => 'Direction des Systèmes d\'Information',
                    'titre_de_poste' => 'Ingénieur réseau',
                    'needs_password_change' => true,
                ],
            ]);

        $user = User::where('matricule', '12345')->firstOrFail();
        $this->assertTrue(Hash::check(User::MOT_DE_PASSE_INITIAL, $user->password));
        $this->assertTrue($user->needs_password_change);
        $this->assertDatabaseHas('activity_logs', ['action' => 'create_user', 'user_id' => $this->admin->id]);
    }

    public function test_creation_refusee_si_rh_ne_connait_pas_le_matricule(): void
    {
        $this->fakeRh();

        $this->api('POST', '/api/admin/users', $this->tokenFor($this->admin), [
            'matricule' => '99999',
            'role_id' => $this->userRole->id,
        ])
            ->assertStatus(422)
            ->assertJson(['message' => 'Matricule invalide ou serveur RH SBEE inaccessible.']);

        $this->assertDatabaseMissing('users', ['matricule' => '99999']);
    }

    public function test_creation_telephone_invalide(): void
    {
        $this->fakeRh();

        $this->api('POST', '/api/admin/users', $this->tokenFor($this->admin), [
            'matricule' => '12345',
            'telephone' => '97000000',
            'role_id' => $this->userRole->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'telephone' => 'Le téléphone doit comporter 10 chiffres et commencer par 01 (ex. 0197000000).',
            ]);
    }

    public function test_middleware_bloque_puis_libere_apres_changement_de_mot_de_passe(): void
    {
        $user = User::create([
            'matricule' => '12345',
            'nom' => 'HOUNSOU',
            'prenom' => 'Afi',
            'password' => Hash::make(User::MOT_DE_PASSE_INITIAL),
            'role_id' => $this->userRole->id,
            'is_active' => true,
        ]);

        // Connexion avec le mot de passe initial
        $login = $this->postJson('/api/login', [
            'matricule' => '12345',
            'password' => User::MOT_DE_PASSE_INITIAL,
        ])->assertOk()->assertJsonPath('user.needs_password_change', true);
        $token = $login->json('token');

        // Routes protégées bloquées
        $this->api('GET', '/api/applications', $token)
            ->assertForbidden()
            ->assertExactJson([
                'message' => 'Vous devez changer votre mot de passe initial avant de continuer.',
                'requires_password_change' => true,
            ]);
        $this->api('PUT', '/api/profile', $token, ['email' => 'afi@sbee.bj'])->assertForbidden();

        // Routes exemptées accessibles
        $this->api('GET', '/api/me', $token)
            ->assertOk()
            ->assertJsonPath('user.needs_password_change', true)
            ->assertJsonPath('user.titre_de_poste', null);

        // Changement de mot de passe
        $this->api('PUT', '/api/profile/password', $token, [
            'current_password' => User::MOT_DE_PASSE_INITIAL,
            'password' => 'NouveauMdp@2026',
            'password_confirmation' => 'NouveauMdp@2026',
        ])->assertOk()->assertJsonPath('user.needs_password_change', false);

        $this->assertFalse($user->fresh()->needs_password_change);

        $this->api('GET', '/api/applications', $token)->assertOk();
        $this->api('GET', '/api/me', $token)->assertJsonPath('user.needs_password_change', false);

        // Déconnexion toujours possible
        $this->api('POST', '/api/logout', $token)->assertOk();
    }

    public function test_mot_de_passe_initial_refuse_comme_nouveau_mot_de_passe(): void
    {
        $user = User::create([
            'matricule' => '12345',
            'nom' => 'HOUNSOU',
            'prenom' => 'Afi',
            'password' => Hash::make(User::MOT_DE_PASSE_INITIAL),
            'role_id' => $this->userRole->id,
            'is_active' => true,
        ]);
        $token = $this->tokenFor($user);

        $this->api('PUT', '/api/profile/password', $token, [
            'current_password' => User::MOT_DE_PASSE_INITIAL,
            'password' => User::MOT_DE_PASSE_INITIAL,
            'password_confirmation' => User::MOT_DE_PASSE_INITIAL,
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        // Un utilisateur ayant déjà changé ne peut pas revenir au mot de passe initial
        $user->update(['password' => Hash::make('Actuel@2026')]);

        $this->api('PUT', '/api/profile/password', $token, [
            'current_password' => 'Actuel@2026',
            'password' => User::MOT_DE_PASSE_INITIAL,
            'password_confirmation' => User::MOT_DE_PASSE_INITIAL,
        ])->assertStatus(422)->assertJsonValidationErrors([
            'password' => 'Le nouveau mot de passe ne peut pas être le mot de passe initial.',
        ]);

        // Ni réutiliser le mot de passe actuel
        $this->api('PUT', '/api/profile/password', $token, [
            'current_password' => 'Actuel@2026',
            'password' => 'Actuel@2026',
            'password_confirmation' => 'Actuel@2026',
        ])->assertStatus(422)->assertJsonValidationErrors([
            'password' => 'Le nouveau mot de passe doit être différent du mot de passe actuel.',
        ]);

        $this->assertTrue(Hash::check('Actuel@2026', $user->fresh()->password));
    }

    public function test_reinitialisation_du_mot_de_passe_par_admin(): void
    {
        $user = User::create([
            'matricule' => '12345',
            'nom' => 'HOUNSOU',
            'prenom' => 'Afi',
            'password' => Hash::make('Perso@2026'),
            'role_id' => $this->userRole->id,
            'is_active' => true,
        ]);
        $this->tokenFor($user);
        $this->tokenFor($user);
        $this->assertSame(2, $user->tokens()->count());

        $adminToken = $this->tokenFor($this->admin);

        $this->api('POST', "/api/admin/users/{$user->id}/reset-password", $adminToken)
            ->assertOk()
            ->assertExactJson([
                'message' => "Mot de passe réinitialisé. L'utilisateur devra le changer à sa prochaine connexion.",
            ]);

        $user->refresh();
        $this->assertTrue($user->needs_password_change);
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseHas('activity_logs', ['action' => 'reset_password', 'user_id' => $this->admin->id]);

        // Interdit sur soi-même
        $this->api('POST', "/api/admin/users/{$this->admin->id}/reset-password", $adminToken)
            ->assertStatus(422);
        $this->assertFalse($this->admin->fresh()->needs_password_change);
    }

    public function test_mise_a_jour_sans_mot_de_passe(): void
    {
        $user = User::create([
            'matricule' => '12345',
            'nom' => 'HOUNSOU',
            'prenom' => 'Afi',
            'password' => Hash::make('Perso@2026'),
            'role_id' => $this->userRole->id,
            'is_active' => true,
        ]);

        $this->api('PUT', "/api/admin/users/{$user->id}", $this->tokenFor($this->admin), [
            'telephone' => '0196000000',
            'nom' => 'PIRATE',
            'password' => 'Autre@2026',
        ])->assertOk()->assertJsonPath('user.telephone', '0196000000');

        $user->refresh();
        $this->assertSame('HOUNSOU', $user->nom);
        $this->assertTrue(Hash::check('Perso@2026', $user->password));
    }

    public function test_non_admin_interdit(): void
    {
        Http::fake();

        $user = User::create([
            'matricule' => 'USER001',
            'nom' => 'KOUTON',
            'prenom' => 'Jean',
            'password' => Hash::make('User@2024'),
            'role_id' => $this->userRole->id,
            'is_active' => true,
        ]);
        $token = $this->tokenFor($user);

        $this->api('GET', '/api/admin/employes/12345', $token)->assertForbidden();
        $this->api('POST', '/api/admin/users', $token, [
            'matricule' => '12345',
            'role_id' => $this->userRole->id,
        ])->assertForbidden();
        $this->api('POST', "/api/admin/users/{$this->admin->id}/reset-password", $token)->assertForbidden();

        Http::assertNothingSent();
    }
}
