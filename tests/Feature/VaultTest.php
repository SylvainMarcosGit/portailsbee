<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\AppCredential;
use App\Models\Application;
use App\Models\Category;
use App\Models\Role;
use App\Models\User;
use App\Services\VaultCipher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * Coffre d'identifiants et jeton de l'extension SBEE : chiffrement, routes portail,
 * routes extension, séparation des jetons ('*' / vault), révocations, rotation de clé.
 */
class VaultTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'Coffre@2026';

    private Role $adminRole;

    private Role $agentRole;

    private User $admin;

    private User $agent;

    private Application $appFill;

    private Application $appNone;

    private Application $appOther;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'vault.key' => VaultCipher::generateKey(),
            'vault.previous_keys' => [],
            'app.url' => 'https://portail.sbee.test',
        ]);

        $this->adminRole = Role::create(['name' => 'Administrateur', 'slug' => Role::SLUG_ADMIN]);
        $this->agentRole = Role::create(['name' => 'Agent', 'slug' => 'agent']);

        $this->admin = $this->makeUser('ADMIN001', $this->adminRole);
        $this->agent = $this->makeUser('AGENT001', $this->agentRole);

        $this->appFill = $this->makeApplication('Facturation', [
            'sso_mode' => 'fill_submit',
            'login_url_pattern' => 'https://facturation.sbee.bj/login*',
            'identifier_type' => 'matricule',
            'username_selector' => '#username',
            'password_selector' => '#password',
            'submit_selector' => 'button[type=submit]',
        ]);
        $this->appNone = $this->makeApplication('Intranet');
        $this->appOther = $this->makeApplication('Paie', [
            'sso_mode' => 'fill',
            'login_url_pattern' => 'https://paie.sbee.bj/*',
        ]);

        $this->agentRole->applications()->attach([$this->appFill->id, $this->appNone->id]);
    }

    /**
     * Mot de passe différent du mot de passe initial, sinon le middleware password.changed bloque
     */
    private function makeUser(string $matricule, Role $role): User
    {
        return User::create([
            'matricule' => $matricule,
            'nom' => 'TEST',
            'prenom' => $matricule,
            'email' => strtolower($matricule).'@sbee.bj',
            'password' => Hash::make(self::PASSWORD),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    private function makeApplication(string $name, array $sso = []): Application
    {
        $category = Category::firstOrCreate(['name' => 'Gestion']);

        return Application::create(array_merge([
            'name' => $name,
            'url' => 'https://'.strtolower($name).'.sbee.bj',
            'category_id' => $category->id,
            'deployment_date' => '2024-01-01',
            'developed_by' => 'DSI',
            'is_active' => true,
        ], $sso));
    }

    private function portalToken(User $user): string
    {
        return $user->createToken('auth_token')->plainTextToken;
    }

    private function extensionToken(User $user): string
    {
        return $user->createToken('sbee-extension', ['vault'], now()->addHours(8))->plainTextToken;
    }

    /**
     * Requête JSON authentifiée par un vrai jeton Sanctum (garde réinitialisée à chaque appel)
     */
    private function api(string $method, string $uri, string $token, array $data = [])
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->json($method, $uri, $data);
    }

    private function storeCredential(User $user, Application $application, string $login, string $secret): AppCredential
    {
        return AppCredential::create([
            'user_id' => $user->id,
            'application_id' => $application->id,
            'login_identifier' => $login,
            'secret' => app(VaultCipher::class)->encrypt($secret),
        ]);
    }

    private function extensionTokenCount(User $user): int
    {
        return $user->tokens()->where('name', 'sbee-extension')->count();
    }

    public function test_enregistrement_chiffre_le_secret_en_base(): void
    {
        $response = $this->api('PUT', "/api/vault/{$this->appFill->id}", $this->portalToken($this->agent), [
            'login_identifier' => 'agent.facturation',
            'secret' => 'MotDePasse!42',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Identifiants enregistrés.')
            ->assertJsonPath('credential.application_id', $this->appFill->id)
            ->assertJsonPath('credential.login_identifier', 'agent.facturation')
            ->assertJsonMissingPath('credential.secret');

        $stored = DB::table('app_credentials')->where('user_id', $this->agent->id)->value('secret');

        $this->assertNotEquals('MotDePasse!42', $stored);
        $this->assertStringNotContainsString('MotDePasse!42', $stored);
        $this->assertSame('MotDePasse!42', app(VaultCipher::class)->decrypt($stored));
        $this->assertDatabaseHas('activity_logs', ['action' => 'vault_save', 'application_id' => $this->appFill->id]);
    }

    public function test_mise_a_jour_puis_suppression(): void
    {
        $token = $this->portalToken($this->agent);
        $this->storeCredential($this->agent, $this->appFill, 'ancien', 'AncienSecret');

        $this->api('PUT', "/api/vault/{$this->appFill->id}", $token, [
            'login_identifier' => 'nouveau',
            'secret' => 'NouveauSecret',
        ])->assertOk();

        $this->assertSame(1, AppCredential::count());
        $credential = AppCredential::first();
        $this->assertSame('nouveau', $credential->login_identifier);
        $this->assertSame('NouveauSecret', $credential->plainSecret());

        $this->api('DELETE', "/api/vault/{$this->appFill->id}", $token)
            ->assertOk()
            ->assertJsonPath('message', 'Identifiants supprimés.');

        $this->assertSame(0, AppCredential::count());
    }

    public function test_validation_identifiants(): void
    {
        $this->api('PUT', "/api/vault/{$this->appFill->id}", $this->portalToken($this->agent), [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['login_identifier', 'secret']);
    }

    public function test_liste_du_coffre_sans_aucun_secret(): void
    {
        $this->storeCredential($this->agent, $this->appFill, 'agent.facturation', 'SecretTresConfidentiel');

        $response = $this->api('GET', '/api/vault', $this->portalToken($this->agent));

        $response->assertOk()->assertJsonCount(2, 'applications');
        $this->assertStringNotContainsString('SecretTresConfidentiel', $response->getContent());
        $this->assertStringNotContainsString('"secret"', $response->getContent());

        $facturation = collect($response->json('applications'))->firstWhere('application_id', $this->appFill->id);
        $this->assertTrue($facturation['has_credential']);
        $this->assertSame('agent.facturation', $facturation['login_identifier']);
        $this->assertSame('fill_submit', $facturation['sso_mode']);
        $this->assertSame('matricule', $facturation['identifier_type']);
        $this->assertSame('Gestion', $facturation['category']);
    }

    public function test_admin_voit_toutes_les_applications_actives(): void
    {
        $this->appNone->update(['is_active' => false]);

        $this->api('GET', '/api/vault', $this->portalToken($this->admin))
            ->assertOk()
            ->assertJsonCount(2, 'applications');
    }

    public function test_application_non_attribuee_refusee(): void
    {
        $this->api('PUT', "/api/vault/{$this->appOther->id}", $this->portalToken($this->agent), [
            'login_identifier' => 'agent',
            'secret' => 'Secret',
        ])->assertStatus(403);

        $this->assertSame(0, AppCredential::count());
    }

    public function test_lanceur_indique_has_credential_et_champs_sso(): void
    {
        $this->storeCredential($this->agent, $this->appFill, 'agent', 'Secret');

        $response = $this->api('GET', '/api/applications', $this->portalToken($this->agent))->assertOk();

        $apps = collect($response->json('applications'))->keyBy('id');
        $this->assertTrue($apps[$this->appFill->id]['has_credential']);
        $this->assertFalse($apps[$this->appNone->id]['has_credential']);
        $this->assertSame('https://facturation.sbee.bj/login*', $apps[$this->appFill->id]['login_url_pattern']);
        $this->assertSame('none', $apps[$this->appNone->id]['sso_mode']);
    }

    public function test_coffre_non_configure_renvoie_503(): void
    {
        config(['vault.key' => null]);
        $token = $this->portalToken($this->agent);

        $this->api('GET', '/api/vault', $token)->assertOk();

        $this->api('PUT', "/api/vault/{$this->appFill->id}", $token, [
            'login_identifier' => 'agent',
            'secret' => 'Secret',
        ])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Coffre non configuré : définissez VAULT_KEY dans le fichier .env (php artisan vault:key).');

        $this->assertSame(0, AppCredential::count());
    }

    public function test_jeton_extension_ability_vault_8h_et_anciens_revoques(): void
    {
        $portal = $this->portalToken($this->agent);
        $this->extensionToken($this->agent);
        $this->extensionToken($this->agent);

        $response = $this->api('POST', '/api/vault/extension-token', $portal);

        $response->assertCreated()
            ->assertJsonPath('api_base', 'https://portail.sbee.test/api')
            ->assertJsonStructure(['token', 'expires_at', 'api_base']);

        $this->assertSame(1, $this->extensionTokenCount($this->agent));

        $token = PersonalAccessToken::findToken($response->json('token'));
        $this->assertSame('sbee-extension', $token->name);
        $this->assertSame(['vault'], $token->abilities);
        $this->assertEqualsWithDelta(now()->addHours(8)->timestamp, $token->expires_at->timestamp, 60);
        $this->assertEqualsWithDelta(now()->addHours(8)->timestamp, strtotime($response->json('expires_at')), 60);

        // Le jeton du portail reste valide
        $this->assertSame(1, $this->agent->tokens()->where('name', 'auth_token')->count());
    }

    public function test_chaque_navigateur_garde_son_propre_jeton_extension(): void
    {
        $portal = $this->portalToken($this->agent);
        $edge = 'edge-0000-1111-2222';
        $opera = 'opera-3333-4444-5555';

        $jetonEdge = $this->api('POST', '/api/vault/extension-token', $portal, ['instance_id' => $edge])->assertCreated()->json('token');
        $jetonOpera = $this->api('POST', '/api/vault/extension-token', $portal, ['instance_id' => $opera])->assertCreated()->json('token');

        // Relier Opera ne révoque pas Edge : les deux navigateurs restent reliés.
        $this->assertSame(2, $this->extensionTokenCount($this->agent));
        $this->api('GET', '/api/vault/ext/config', $jetonEdge)->assertOk();
        $this->api('GET', '/api/vault/ext/config', $jetonOpera)->assertOk();
        $this->assertSame(['vault', 'instance:'.$edge], PersonalAccessToken::findToken($jetonEdge)->abilities);

        // Une nouvelle demande du même navigateur remplace seulement son ancien jeton.
        $nouveauEdge = $this->api('POST', '/api/vault/extension-token', $portal, ['instance_id' => $edge])->assertCreated()->json('token');
        $this->assertSame(2, $this->extensionTokenCount($this->agent));
        $this->assertNull(PersonalAccessToken::findToken($jetonEdge));
        $this->api('GET', '/api/vault/ext/config', $nouveauEdge)->assertOk();
        $this->api('GET', '/api/vault/ext/config', $jetonOpera)->assertOk();
    }

    public function test_jetons_extension_expires_nettoyes_et_identifiant_invalide_refuse(): void
    {
        $portal = $this->portalToken($this->agent);
        $this->agent->createToken('sbee-extension', ['vault', 'instance:ancien-0000-1111'], now()->subMinute());

        $this->api('POST', '/api/vault/extension-token', $portal, ['instance_id' => 'nouveau-2222-3333'])->assertCreated();
        $this->assertSame(1, $this->extensionTokenCount($this->agent));

        $this->api('POST', '/api/vault/extension-token', $portal, ['instance_id' => 'pas valide !'])->assertStatus(422);
    }

    public function test_jeton_extension_refuse_hors_du_coffre(): void
    {
        $token = $this->extensionToken($this->agent);

        $this->api('GET', '/api/applications', $token)->assertStatus(403);
        $this->api('GET', '/api/me', $token)->assertStatus(403);
        $this->api('GET', '/api/vault', $token)->assertStatus(403);
        $this->api('POST', '/api/vault/extension-token', $token)->assertStatus(403);
        $this->api('PUT', '/api/profile/password', $token, [])->assertStatus(403);
    }

    public function test_jeton_portail_refuse_sur_les_routes_extension(): void
    {
        $token = $this->portalToken($this->agent);

        $this->api('GET', '/api/vault/ext/config', $token)
            ->assertStatus(403)
            ->assertJsonPath('message', "Réservé à l'extension SBEE.");
        $this->api('POST', "/api/vault/ext/{$this->appFill->id}/reveal", $token)->assertStatus(403);
    }

    public function test_jeton_vault_mal_nomme_refuse_sur_les_routes_extension(): void
    {
        $token = $this->agent->createToken('autre', ['vault'])->plainTextToken;

        $this->api('GET', '/api/vault/ext/config', $token)->assertStatus(403);
    }

    public function test_config_extension_ne_liste_que_les_applications_sso(): void
    {
        $this->storeCredential($this->agent, $this->appFill, 'agent', 'Secret');

        $response = $this->api('GET', '/api/vault/ext/config', $this->extensionToken($this->agent));

        $response->assertOk()
            ->assertJsonPath('user.matricule', 'AGENT001')
            ->assertJsonPath('user.prenom', 'AGENT001')
            ->assertJsonPath('user.nom', 'TEST')
            ->assertJsonCount(1, 'applications')
            ->assertJsonPath('applications.0.application_id', $this->appFill->id)
            ->assertJsonPath('applications.0.sso_mode', 'fill_submit')
            ->assertJsonPath('applications.0.login_url_pattern', 'https://facturation.sbee.bj/login*')
            ->assertJsonPath('applications.0.username_selector', '#username')
            ->assertJsonPath('applications.0.has_credential', true)
            ->assertJsonPath('applications.0.login_identifier', 'agent');

        $this->assertStringNotContainsString('Secret"', $response->getContent());
    }

    public function test_reveal_renvoie_le_secret_et_trace(): void
    {
        $this->storeCredential($this->agent, $this->appFill, 'agent.facturation', 'MotDePasse!42');

        $this->api('POST', "/api/vault/ext/{$this->appFill->id}/reveal", $this->extensionToken($this->agent))
            ->assertOk()
            ->assertExactJson([
                'login_identifier' => 'agent.facturation',
                'secret' => 'MotDePasse!42',
            ]);

        $this->assertNotNull(AppCredential::first()->last_used_at);
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->agent->id,
            'action' => 'vault_fill',
            'application_id' => $this->appFill->id,
        ]);
    }

    public function test_reveal_sans_identifiant_404(): void
    {
        $this->api('POST', "/api/vault/ext/{$this->appFill->id}/reveal", $this->extensionToken($this->agent))
            ->assertNotFound()
            ->assertJsonPath('message', 'Aucun identifiant enregistré pour cette application.');

        $this->assertSame(0, ActivityLog::where('action', 'vault_fill')->count());
    }

    public function test_reveal_application_non_attribuee_403(): void
    {
        $this->storeCredential($this->agent, $this->appOther, 'agent', 'Secret');

        $this->api('POST', "/api/vault/ext/{$this->appOther->id}/reveal", $this->extensionToken($this->agent))
            ->assertStatus(403);
    }

    public function test_extension_enregistre_et_se_deconnecte(): void
    {
        $token = $this->extensionToken($this->agent);

        $this->api('PUT', "/api/vault/ext/{$this->appFill->id}", $token, [
            'login_identifier' => 'agent',
            'secret' => 'SaisiDansLaPage',
        ])->assertOk()->assertJsonPath('message', 'Identifiants enregistrés.');

        $this->assertSame('SaisiDansLaPage', AppCredential::first()->plainSecret());
        $this->assertDatabaseHas('activity_logs', ['action' => 'vault_save', 'application_id' => $this->appFill->id]);

        $this->api('POST', '/api/vault/ext/logout', $token)->assertOk();
        $this->assertSame(0, $this->extensionTokenCount($this->agent));
        $this->api('GET', '/api/vault/ext/config', $token)->assertStatus(401);
    }

    public function test_logout_portail_revoque_les_jetons_extension(): void
    {
        $portal = $this->portalToken($this->agent);
        $this->extensionToken($this->agent);

        $this->api('POST', '/api/logout', $portal)->assertOk();

        $this->assertSame(0, $this->agent->tokens()->count());
    }

    public function test_desactivation_revoque_les_jetons_extension(): void
    {
        $this->extensionToken($this->agent);

        $this->api('PATCH', "/api/admin/users/{$this->agent->id}/toggle", $this->portalToken($this->admin))->assertOk();

        $this->assertSame(0, $this->extensionTokenCount($this->agent));
    }

    public function test_desactivation_par_formulaire_revoque_les_jetons_extension(): void
    {
        $this->extensionToken($this->agent);

        $this->api('PUT', "/api/admin/users/{$this->agent->id}", $this->portalToken($this->admin), [
            'is_active' => false,
        ])->assertOk();

        $this->assertSame(0, $this->extensionTokenCount($this->agent));
    }

    public function test_reset_password_revoque_les_jetons_extension(): void
    {
        $this->extensionToken($this->agent);

        $this->api('POST', "/api/admin/users/{$this->agent->id}/reset-password", $this->portalToken($this->admin))->assertOk();

        $this->assertSame(0, $this->extensionTokenCount($this->agent));
    }

    public function test_changement_de_mot_de_passe_revoque_les_jetons_extension(): void
    {
        $this->extensionToken($this->agent);

        $this->api('PUT', '/api/profile/password', $this->portalToken($this->agent), [
            'current_password' => self::PASSWORD,
            'password' => 'Nouveau@2026',
            'password_confirmation' => 'Nouveau@2026',
        ])->assertOk();

        $this->assertSame(0, $this->extensionTokenCount($this->agent));
    }

    public function test_suppression_utilisateur_revoque_jetons_et_coffre(): void
    {
        $this->extensionToken($this->agent);
        $this->storeCredential($this->agent, $this->appFill, 'agent', 'Secret');

        $this->api('DELETE', "/api/admin/users/{$this->agent->id}", $this->portalToken($this->admin))->assertOk();

        $this->assertSame(0, PersonalAccessToken::where('tokenable_id', $this->agent->id)->count());
        $this->assertSame(0, AppCredential::count());
    }

    public function test_vault_rotate_rechiffre_avec_la_nouvelle_cle(): void
    {
        $oldKey = config('vault.key');
        $this->storeCredential($this->agent, $this->appFill, 'agent', 'SecretARoter');
        $before = DB::table('app_credentials')->value('secret');

        $newKey = VaultCipher::generateKey();
        config(['vault.key' => $newKey, 'vault.previous_keys' => [$oldKey]]);

        $this->artisan('vault:rotate')->assertSuccessful();

        $after = DB::table('app_credentials')->value('secret');
        $this->assertNotEquals($before, $after);

        // Déchiffrable avec la seule nouvelle clé
        $this->assertSame('SecretARoter', (new VaultCipher($newKey, []))->decrypt($after));
    }

    public function test_vault_key_affiche_une_cle(): void
    {
        $this->artisan('vault:key')
            ->expectsOutputToContain('base64:')
            ->assertSuccessful();
    }

    public function test_admin_enregistre_les_champs_sso(): void
    {
        $token = $this->portalToken($this->admin);
        $category = Category::first();

        $base = [
            'name' => 'Stock',
            'url' => 'https://stock.sbee.bj',
            'category_id' => $category->id,
            'deployment_date' => '2024-05-01',
            'developed_by' => 'DSI',
        ];

        // Mode actif sans URL de connexion : refusé
        $this->api('POST', '/api/admin/applications', $token, $base + ['sso_mode' => 'fill'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['login_url_pattern']);

        $this->api('POST', '/api/admin/applications', $token, $base + ['sso_mode' => 'autre'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sso_mode']);

        // Sans champs SSO : valeurs par défaut
        $created = $this->api('POST', '/api/admin/applications', $token, $base)
            ->assertCreated()
            ->assertJsonPath('application.sso_mode', 'none')
            ->assertJsonPath('application.identifier_type', 'username');

        $id = $created->json('application.id');

        $this->api('PUT', "/api/admin/applications/{$id}", $token, ['sso_mode' => 'fill_submit'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['login_url_pattern']);

        $this->api('PUT', "/api/admin/applications/{$id}", $token, [
            'sso_mode' => 'fill_submit',
            'login_url_pattern' => 'https://stock.sbee.bj/login*',
            'identifier_type' => 'email',
            'username_selector' => '#email',
            'password_selector' => '#pwd',
            'submit_selector' => '#go',
        ])
            ->assertOk()
            ->assertJsonPath('application.sso_mode', 'fill_submit')
            ->assertJsonPath('application.login_url_pattern', 'https://stock.sbee.bj/login*')
            ->assertJsonPath('application.identifier_type', 'email')
            ->assertJsonPath('application.username_selector', '#email')
            ->assertJsonPath('application.password_selector', '#pwd')
            ->assertJsonPath('application.submit_selector', '#go');

        // URL déjà enregistrée : mise à jour partielle acceptée
        $this->api('PUT', "/api/admin/applications/{$id}", $token, ['sso_mode' => 'fill'])->assertOk();

        $all = $this->api('GET', '/api/admin/applications', $token)->assertOk();
        $stock = collect($all->json('applications'))->firstWhere('id', $id);
        $this->assertSame('fill', $stock['sso_mode']);
        $this->assertSame('#pwd', $stock['password_selector']);
    }
}
