<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginErrorMessagesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(bool $active = true): User
    {
        $role = Role::firstOrCreate(['slug' => 'utilisateur'], ['name' => 'Utilisateur']);

        return User::create([
            'matricule' => 'AG00001',
            'nom' => 'TEST',
            'prenom' => 'Agent',
            'role_id' => $role->id,
            'is_active' => $active,
            'password' => Hash::make('MotDePasse#2026'),
        ]);
    }

    public function test_mauvais_mot_de_passe_renvoie_un_message_explicite(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', ['matricule' => 'AG00001', 'password' => 'faux'])
            ->assertStatus(422)
            ->assertJsonPath('errors.matricule.0', 'Les identifiants fournis sont incorrects.');
    }

    public function test_matricule_inconnu_renvoie_le_meme_message(): void
    {
        $this->postJson('/api/login', ['matricule' => 'INCONNU', 'password' => 'faux'])
            ->assertStatus(422)
            ->assertJsonPath('errors.matricule.0', 'Les identifiants fournis sont incorrects.');
    }

    public function test_compte_desactive_renvoie_un_message_explicite(): void
    {
        $this->makeUser(active: false);

        $this->postJson('/api/login', ['matricule' => 'AG00001', 'password' => 'MotDePasse#2026'])
            ->assertStatus(422)
            ->assertJsonPath('errors.matricule.0', "Votre compte est désactivé. Contactez l'administrateur du portail.");
    }

    public function test_compte_desactive_avec_mauvais_mot_de_passe_ne_revele_pas_son_etat(): void
    {
        $this->makeUser(active: false);

        $this->postJson('/api/login', ['matricule' => 'AG00001', 'password' => 'faux'])
            ->assertStatus(422)
            ->assertJsonPath('errors.matricule.0', 'Les identifiants fournis sont incorrects.');
    }
}
