# Publication de l'extension - procédure DSI

Procédure pas à pas pour publier « Coffre d'identifiants SBEE » sur Microsoft Edge Add-ons, sur addons.mozilla.org (distribution non répertoriée) et sur addons.opera.com. Textes des fiches, justification des permissions et notes aux relecteurs : `fiche-boutique.md`.

Règles communes :

- Comptes de la SBEE : créer les comptes développeur avec une adresse de service de la DSI (pas une adresse personnelle), protégée par l'authentification à deux facteurs, et consigner leur détenteur.
- Aucun secret (clé d'API, mot de passe du compte de démonstration) dans le dépôt, les scripts ou les tickets. Les clés d'API vivent dans le coffre de la DSI et ne sont passées qu'en variables d'environnement de la session.
- Toujours déposer un paquet construit pour la production (étape D) avec une nouvelle version (étape E).

## Prérequis

1. Portail de production accessible depuis Internet en HTTPS (les relecteurs des boutiques testent depuis l'extérieur).
2. Page publique de confidentialité en ligne : `https://portail.sbee.bj/extension/confidentialite` (servie par le portail, sans connexion).
3. Compte de démonstration pour les relecteurs : droits limités, une application de test attribuée, données fictives (voir `fiche-boutique.md`).
4. Captures 1280 x 800 réalisées avec ce compte (liste dans `fiche-boutique.md`).
5. Node.js 22 et npm 10 sur le poste de construction.

## D. Reconstruire pour la production (avant tout dépôt)

Les origines du portail sont figées dans le code à la construction. Un paquet construit avec les origines locales par défaut (`http://127.0.0.1:8000,http://localhost:8000`) ne fonctionne pas en production et ne doit jamais être déposé.

```powershell
cd extension
npm ci
$env:PORTAL_ORIGINS = "https://portail.sbee.bj"
npm run typecheck
npm test
npm run package
npm run package:source
Remove-Item Env:PORTAL_ORIGINS
```

```bash
cd extension
npm ci
export PORTAL_ORIGINS=https://portail.sbee.bj
npm run typecheck && npm test && npm run package && npm run package:source
unset PORTAL_ORIGINS
```

Vérifier dans la sortie : `dist/chromium construit (PORTAL_ORIGINS=https://portail.sbee.bj)`, et dans `dist/chromium/manifest.json` que `content_scripts[0].matches` vaut `["https://portail.sbee.bj/*"]`.

Fichiers produits dans `public/extension/` :

- `sbee-extension-chromium.zip` : Edge et Opera (et Chrome) ;
- `sbee-extension-firefox.zip` : Firefox ;
- `sbee-extension-source.zip` : sources pour les relecteurs Firefox et Opera.

Après la publication, reconstruire avec les origines locales pour les tests (`npm run build` sans variable) si besoin : ne pas laisser un paquet local dans `public/extension/` en production.

## E. Incrémenter la version à chaque dépôt

Les boutiques refusent un paquet dont la version a déjà été déposée, même refusé.

1. Modifier `version` dans `extension/package.json` (source de vérité : le manifeste la reprend à la construction). Format `majeur.mineur.correctif`, par exemple `1.1.0` puis `1.1.1` pour une correction, `1.2.0` pour une nouveauté.
2. `npm install --package-lock-only` pour reporter la version dans `package-lock.json`.
3. Reconstruire (étape D) et vérifier `version` dans `dist/*/manifest.json`.
4. Déposer la même version sur toutes les boutiques concernées.

## A. Microsoft Edge Add-ons

1. Créer le compte : https://partner.microsoft.com/dashboard/microsoftedge/overview, se connecter avec un compte Microsoft de la DSI, s'inscrire au programme « Microsoft Edge » (gratuit), type de compte « Entreprise » (vérification de la SBEE par Microsoft, quelques jours).
2. Tableau de bord Edge > **Créer une extension** > déposer `public/extension/sbee-extension-chromium.zip`. Attendre la validation automatique du paquet.
3. **Disponibilité** :
   - Visibilité : **Masquée (Hidden)** pour un usage interne : l'extension n'apparaît pas dans les recherches, elle s'installe avec le lien direct de la fiche. **Publique** sinon.
   - Marchés : au minimum Bénin, ou tous les marchés.
4. **Propriétés** : catégorie « Productivité », URL de la politique de confidentialité `https://portail.sbee.bj/extension/confidentialite`, site web `https://portail.sbee.bj`, contact support (adresse de la DSI). Répondre « Oui » à la question sur les données personnelles.
5. **Fiche (français)** : description longue et courte de `fiche-boutique.md`, logo `store/assets/icone-300x300.png`, petite vignette `store/assets/tuile-440x280.png`, captures 1280 x 800.
6. **Notes de certification** : notes aux relecteurs et justification des permissions de `fiche-boutique.md`, avec le compte de démonstration.
7. **Publier**. Délai de revue indicatif : jusqu'à 7 jours ouvrés ; suivre l'état et les éventuelles demandes de correction dans le tableau de bord.
8. Mise à jour : fiche existante > **Paquets** > déposer le nouveau zip (version incrémentée) > Publier.

Installation imposée par GPO depuis la boutique (facultatif) : **ExtensionInstallForcelist** avec `<identifiant Edge de l'extension>;https://edge.microsoft.com/extensionwebstorebase/v1/crx`. L'identifiant est affiché dans le tableau de bord après publication.

## B. Firefox : distribution non répertoriée (addons.mozilla.org)

La distribution non répertoriée signe l'extension sans la publier dans le catalogue public : la SBEE héberge elle-même le `.xpi` signé.

1. Créer le compte : https://addons.mozilla.org/developers/ > se connecter avec un compte Mozilla de la DSI (authentification à deux facteurs exigée pour déposer), accepter l'accord de distribution.
2. Dépôt, au choix :

   **Par l'interface**
   1. **Soumettre un nouveau module** > « Sur votre propre site » (non répertorié, *On your own*).
   2. Déposer `public/extension/sbee-extension-firefox.zip`. Corriger les erreurs éventuelles du validateur ; les avertissements sur `data_collection_permissions` (pris en charge à partir de Firefox 140) et sur `<all_urls>` sont attendus.
   3. À la question sur le code source : **Oui** (le code est compacté), déposer `public/extension/sbee-extension-source.zip` et coller les instructions de construction (notes aux relecteurs de `fiche-boutique.md`).
   4. Renseigner la description et les notes aux relecteurs, valider. La signature est en général automatique en quelques minutes ; une revue humaine peut intervenir ensuite.

   **Par la ligne de commande (`web-ext`)**
   1. Créer les clés d'API : https://addons.mozilla.org/developers/addon/api/key/ (émetteur JWT et secret JWT). Les ranger dans le coffre de la DSI, jamais dans un fichier du projet.
   2. Dans la session uniquement :

      ```powershell
      $env:WEB_EXT_API_KEY = "<émetteur JWT>"
      $env:WEB_EXT_API_SECRET = "<secret JWT>"
      npx web-ext sign --source-dir dist/firefox --channel=unlisted --upload-source-code ..\public\extension\sbee-extension-source.zip --artifacts-dir web-ext-artifacts
      Remove-Item Env:WEB_EXT_API_KEY, Env:WEB_EXT_API_SECRET
      ```

      `web-ext` lit les clés dans `WEB_EXT_API_KEY` et `WEB_EXT_API_SECRET` : ne pas les passer en argument (elles resteraient dans l'historique du terminal).
3. Récupérer le `.xpi` signé : dans `web-ext-artifacts/` (ligne de commande) ou dans le tableau de bord, **Gérer le statut et les versions** > version > fichier `.xpi`.
4. Héberger sur le portail : copier le fichier signé en `public/extension/sbee-extension-firefox.xpi` (nom stable), puis le servir en `https://portail.sbee.bj/extension/sbee-extension-firefox.xpi` avec le type `application/x-xpinstall`.
5. Installation : lien direct vers le `.xpi` (Firefox propose l'installation), ou installation imposée par stratégie `ExtensionSettings` (voir `README.md`, section « Firefox »).
6. Mise à jour : incrémenter la version, reconstruire, signer de nouveau, remplacer le `.xpi`. Pour des mises à jour automatiques, ajouter plus tard une `update_url` (fichier `updates.json` hébergé sur le portail) dans `browser_specific_settings.gecko`.

## C. Opera (addons.opera.com)

1. Créer le compte : https://addons.opera.com/developer/ > se connecter avec un compte Opera de la DSI, compléter le profil développeur (nom « SBEE - DSI », adresse de contact).
2. **Upload new extension** > déposer `public/extension/sbee-extension-chromium.zip`.
3. Fiche : nom, descriptions, catégorie « Productivité », icône `icons/icon-128.png`, image `store/assets/tuile-440x280.png`, captures 1280 x 800, URL de la politique de confidentialité, page d'accueil `https://portail.sbee.bj`.
4. **Code source** : Opera exige les sources lisibles quand le code livré est compacté. Joindre `public/extension/sbee-extension-source.zip` (ou un lien de téléchargement) et les instructions de construction, avec les notes aux relecteurs et le compte de démonstration.
5. Soumettre à la modération. La revue est manuelle : compter de quelques jours à plusieurs semaines ; répondre aux messages des modérateurs dans l'espace développeur.
6. Mise à jour : fiche > **Upload new version** avec le zip et les sources de la nouvelle version.

## Chrome Web Store (facultatif)

Même paquet que Edge et Opera. Compte développeur : https://chrome.google.com/webstore/devconsole (frais d'inscription uniques de 5 USD). Visibilité « Non répertoriée » pour un usage interne. Mêmes textes, visuels et justifications.

## F. Après publication : liens boutique dans le portail

1. Relever l'adresse publique de chaque fiche :
   - Edge : `https://microsoftedge.microsoft.com/addons/detail/<identifiant>` ;
   - Opera : `https://addons.opera.com/fr/extensions/details/<nom-de-la-fiche>/` ;
   - Chrome (si publiée) : `https://chromewebstore.google.com/detail/<identifiant>` ;
   - Firefox (non répertoriée, pas de fiche publique) : l'adresse du `.xpi` signé hébergé sur le portail, `/extension/sbee-extension-firefox.xpi`.
2. Renseigner ces adresses dans `resources/js/app/components/ExtensionInstall.tsx`, constante `STORE_LINKS` (laisser `null` pour un navigateur sans publication) :

   ```ts
   const STORE_LINKS: Record<'edge' | 'firefox' | 'opera' | 'chrome', string | null> = {
     edge: 'https://microsoftedge.microsoft.com/addons/detail/<identifiant>',
     firefox: '/extension/sbee-extension-firefox.xpi',
     opera: 'https://addons.opera.com/fr/extensions/details/<nom-de-la-fiche>/',
     chrome: null,
   };
   ```

3. Reconstruire le portail (`npm run build` à la racine) et déployer. Pour un navigateur dont le lien est renseigné, la page « Installer l'extension » affiche le bouton « Installer depuis la boutique » à la place des étapes manuelles.
4. Retirer ou désactiver le compte de démonstration utilisé pour la revue.
5. Si des agents avaient chargé l'extension en mode développeur : leur demander de la retirer (`edge://extensions`, `opera://extensions`) avant d'installer la version de la boutique, pour éviter deux extensions actives.

## Ce que la DSI doit fournir

- Comptes développeur : Microsoft Partner Center (Edge), Mozilla (AMO), Opera ; Google (Chrome) si souhaité.
- Adresse définitive du portail de production en HTTPS, accessible depuis Internet, et sa valeur `PORTAL_ORIGINS`.
- Compte de démonstration et application de test attribuée, pour les relecteurs.
- Captures 1280 x 800 (liste dans `fiche-boutique.md`).
- Adresse de contact du support affichée sur les fiches.
- Validation du texte de la politique de confidentialité par le responsable de la protection des données.
