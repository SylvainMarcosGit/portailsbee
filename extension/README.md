# Extension SBEE - Coffre d'identifiants

Extension navigateur qui remplit (et, si l'application est configurée pour, valide) les formulaires de connexion des applications SBEE à partir du coffre d'identifiants du portail.

- Une seule base de code TypeScript, deux paquets : **Chromium** (Edge, Chrome, Opera) et **Firefox**, tous deux en Manifest V3.
- Le jeton du coffre (Sanctum, ability `vault`, 8 h) est transmis par la page du portail via `window.postMessage`. Pas de `externally_connectable` (absent de Firefox).

## Prérequis

- Node.js 20 ou plus récent, npm.
- Le portail doit exposer les routes `/api/vault/ext/*` (voir le contrat du coffre).

## Construction

```bash
cd extension
npm install
npm run build        # dist/chromium et dist/firefox
npm run typecheck    # tsc --noEmit
npm test             # tests unitaires (glob, détection de formulaire)
npm run package      # build + zips dans ../public/extension/
```

`npm run package` produit, servis par le portail :

- `public/extension/sbee-extension-chromium.zip`
- `public/extension/sbee-extension-firefox.zip`

### Variables de construction

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `PORTAL_ORIGIN` | `http://127.0.0.1:8000` | Origine exacte du portail (schéma, hôte, port). Le script « portail » ne s'exécute que sur cette origine, et le jeton n'est accepté que si `api_base` commence par elle. |
| `NODE_ENV` | - | `development` désactive la minification. |

L'origine est figée dans le code à la construction : un paquet construit pour la recette ne fonctionne pas avec la production, et inversement.

```powershell
# PowerShell
$env:PORTAL_ORIGIN = "https://portail.sbee.bj"; npm run package
```

```bash
# bash
PORTAL_ORIGIN=https://portail.sbee.bj npm run package
```

## Chargement non empaqueté (développement, recette)

### Edge, Chrome, Opera

1. Ouvrir `edge://extensions` (ou `chrome://extensions`, `opera://extensions`).
2. Activer le **mode développeur**.
3. **Charger l'extension non empaquetée** et choisir `extension/dist/chromium`.
4. Après chaque `npm run build`, cliquer sur **Recharger** dans la carte de l'extension.

### Firefox (115 ou plus récent)

1. Ouvrir `about:debugging#/runtime/this-firefox`.
2. **Charger un module complémentaire temporaire** et choisir `extension/dist/firefox/manifest.json`.
3. Le module est retiré à la fermeture de Firefox.
4. Avant Firefox 127, l'accès aux sites (`<all_urls>`) n'est pas accordé à l'installation : ouvrir la fenêtre de l'extension et cliquer sur **Autoriser l'accès aux sites** (ou `about:addons` > Coffre SBEE > Permissions).

## Fonctionnement

1. L'agent se connecte au portail. La page du portail détecte l'extension (`SBEE_EXTENSION_READY`), demande un jeton de coffre et le transmet (`SBEE_VAULT_TOKEN`). L'extension accuse réception (`SBEE_VAULT_TOKEN_ACK`).
2. Le jeton et la configuration (applications, motifs d'URL, sélecteurs) sont gardés dans `storage.session` : effacés à la fermeture du navigateur, jamais dans `storage.local` ni `localStorage`. La configuration est rechargée à la réception du jeton puis toutes les 10 minutes.
3. Sur chaque page, le script « application » demande au background si l'adresse correspond au `login_url_pattern` d'une application (joker `*`). Sinon il ne fait rien.
4. Si l'application a des identifiants enregistrés : remplissage des champs (sélecteurs configurés, sinon heuristique : champ mot de passe visible et champ texte/email/tel qui le précède dans le même formulaire), puis validation si le mode est `fill_submit`. Une seule tentative automatique par chargement de page ; les formulaires affichés tardivement sont surveillés pendant 10 s. Les connexions en deux étapes (identifiant, puis mot de passe sur l'écran suivant) sont gérées.
5. Garde-fou : si la même étape a déjà été validée automatiquement dans l'onglet il y a moins de 30 s (identifiants refusés), l'extension remplit sans valider.
6. À la soumission d'un formulaire saisi à la main, l'extension propose « Enregistrer ces identifiants dans votre coffre SBEE ? » ou « Mettre à jour le mot de passe enregistré ? ». Si la page change, la proposition est conservée 60 s pour l'onglet et réaffichée au chargement suivant.
7. À la déconnexion du portail (`SBEE_VAULT_LOGOUT`), l'extension révoque son jeton (`POST /vault/ext/logout`) et vide `storage.session`. Une réponse 401, ou 403 « Réservé à l'extension SBEE. » / « Ce jeton n'est pas autorisé pour cette opération. », a le même effet, et l'extension redemande un jeton à un onglet portail ouvert (`SBEE_TOKEN_REQUEST`). Un autre 403 (application non attribuée ou désactivée) ne déconnecte pas : la page affiche « Cette application ne fait pas partie de vos accès dans le portail. » et la capture est oubliée. Un 503 affiche « Le coffre SBEE n'est pas encore configuré. Contactez la DSI. », sans déconnexion.

## Déploiement par la DSI

### Edge et Chrome : installation imposée par GPO

1. Construire avec l'origine de production : `PORTAL_ORIGIN=https://portail.sbee.bj npm run build`.
2. Empaqueter `dist/chromium` en CRX signé avec une clé privée conservée par la DSI (la clé fixe l'identifiant de l'extension ; ne jamais la perdre ni la publier) :
   `msedge --pack-extension=dist\chromium --pack-extension-key=sbee-extension.pem` (ou `chrome` avec les mêmes options).
3. Héberger le `.crx` et un `update.xml` sur le portail, par exemple `https://portail.sbee.bj/extension/update.xml` :

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
     <app appid="IDENTIFIANT_DE_L_EXTENSION">
       <updatecheck codebase="https://portail.sbee.bj/extension/sbee-extension.crx" version="1.0.0" />
     </app>
   </gupdate>
   ```

4. GPO (modèles ADMX Edge / Chrome) : **ExtensionInstallForcelist** avec la valeur
   `IDENTIFIANT_DE_L_EXTENSION;https://portail.sbee.bj/extension/update.xml`.
   Pour une mise à jour : incrémenter `version` dans `package.json`, reconstruire, réempaqueter avec la même clé, mettre à jour `update.xml`.

### Firefox : signature Mozilla « unlisted » + stratégie

1. Construire `dist/firefox` avec l'origine de production.
2. Signer en distribution privée (non publiée sur le catalogue) avec une clé d'API AMO :
   `npx web-ext sign --source-dir dist/firefox --channel unlisted --api-key ... --api-secret ...`
3. Héberger le `.xpi` signé sur le portail.
4. Installation imposée, au choix :
   - GPO (modèles ADMX Firefox) : **ExtensionSettings** avec `extension@sbee.bj` en `installation_mode: force_installed` et `install_url` vers le `.xpi` ;
   - ou `policies.json` dans `distribution/` du dossier d'installation de Firefox :

   ```json
   {
     "policies": {
       "ExtensionSettings": {
         "extension@sbee.bj": {
           "installation_mode": "force_installed",
           "install_url": "https://portail.sbee.bj/extension/sbee-extension-firefox.xpi"
         }
       }
     }
   }
   ```

### Opera

Opera accepte le paquet Chromium mais pas l'installation imposée par stratégie : l'agent l'installe une fois depuis la page « Installer l'extension » du portail (décompresser `sbee-extension-chromium.zip`, `opera://extensions`, mode développeur, **Charger l'extension non empaquetée**), ou via l'extension « Install Chrome Extensions » d'Opera avec le CRX.

## Limites connues

- Captcha, code à usage unique (OTP), clé de sécurité, authentification par certificat : non gérés, l'agent les complète lui-même.
- Clients lourds (applications Windows, Java, terminaux) : hors de portée d'une extension navigateur.
- Safari et navigateurs mobiles : non pris en charge.
- Formulaires dans des iframes d'une autre origine : remplis si l'adresse de l'iframe correspond au motif de l'application ; la proposition d'enregistrement s'affiche dans la page principale.
- Formulaires à deux champs mot de passe ou plus (inscription, changement de mot de passe) : ignorés volontairement.
- Pages qui bloquent les événements synthétiques ou vérifient `isTrusted` : remplissage possible mais validation automatique parfois refusée ; passer l'application en mode `fill`.
- Firefox antérieur à 127 : l'accès aux sites doit être accordé une fois (voir plus haut), sauf installation imposée par stratégie.

## Sécurité

- Le pont accepte un message uniquement si `event.source === window`, `event.origin === PORTAL_ORIGIN`, `data.source === 'sbee-portail'` et si `api_base` commence par `PORTAL_ORIGIN/` (et a exactement cette origine). Les réponses (`READY`, `ACK`, `TOKEN_REQUEST`) sont envoyées par `postMessage` ciblé sur `PORTAL_ORIGIN`, jamais `*`.
- Le jeton n'ouvre que les routes du coffre (ability `vault`, 8 h) ; il est révoqué à la déconnexion du portail.
- Le secret n'est remis par le background qu'à une page dont l'adresse correspond au motif de connexion de l'application ; chaque remise est journalisée côté portail (`vault_fill`).
- Le jeton, la configuration et une capture en attente (60 s maximum) vivent dans `storage.session` ; l'extension garde aussi une empreinte SHA-256 des derniers identifiants utilisés pour éviter des propositions inutiles. Rien dans `storage.local`, `localStorage` ni dans les journaux.
- La proposition d'enregistrement est rendue dans un shadow DOM fermé : la page ne peut ni la lire ni la modifier.
- `host_permissions: <all_urls>` est nécessaire pour remplir des applications tierces de domaines inconnus à l'avance ; le script « application » reste inactif tant que l'adresse ne correspond à aucun motif.

## Arborescence

```
extension/
  package.json, tsconfig.json, vitest.config.ts
  scripts/build.mjs      construction des deux cibles et des manifestes
  scripts/package.mjs    zips vers ../public/extension/
  scripts/icons.mjs      génération des icônes (carré blanc, filet rouge, « SB »)
  icons/                 icon-16/32/48/128.png
  src/background.ts      état, API, routage des messages
  src/content-portail.ts pont postMessage avec le portail
  src/content-app.ts     remplissage, capture, proposition
  src/popup.html|ts|css  fenêtre de l'icône
  src/lib/               api, glob, fill, detect, prompt, messages
  tests/                 glob.test.ts, detect.test.ts
```
