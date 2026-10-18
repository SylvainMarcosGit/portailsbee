# Fiche boutique - Coffre d'identifiants SBEE

Textes à reprendre tels quels dans Edge Add-ons (Partner Center), addons.mozilla.org (distribution non répertoriée : seuls la description et les notes aux relecteurs servent) et addons.opera.com. Langue de la fiche : français.

## Nom

`Coffre d'identifiants SBEE` (26 caractères, limite 45). Identique au champ `name` du manifeste.

Nom court (manifeste, `short_name`) : `Coffre SBEE`.

## Description courte

Limite 132 caractères. Identique au champ `description` du manifeste.

> Remplit vos connexions aux applications SBEE à partir du coffre chiffré du portail SBEE. Réservée aux agents de la SBEE.

(120 caractères.)

## Description longue

> L'extension « Coffre d'identifiants SBEE » est l'outil officiel de la Société Béninoise d'Énergie Électrique (SBEE) pour ses agents. Elle remplit pour vous la page de connexion des applications qui vous sont attribuées dans le portail SBEE, à partir de votre coffre d'identifiants.
>
> Fonctionnement
> - Connectez-vous au portail SBEE : l'extension se relie automatiquement à votre coffre pour la durée de votre session (8 heures au plus).
> - Ouvrez la page de connexion d'une application attribuée : l'identifiant et le mot de passe sont remplis, et la connexion est validée si l'application est configurée pour.
> - Vous vous connectez à la main ? L'extension propose d'enregistrer ou de mettre à jour les identifiants dans votre coffre.
> - La fenêtre de l'extension indique l'état de la connexion, l'application reconnue sur l'onglet, et permet un remplissage manuel.
>
> Sécurité et confidentialité
> - Les mots de passe sont enregistrés chiffrés (AES-256-GCM) dans le coffre du portail SBEE, jamais dans le stockage permanent du navigateur.
> - L'extension ne garde qu'un jeton d'accès de 8 heures et la configuration, en mémoire de session du navigateur, effacés à la déconnexion ou à la fermeture du navigateur.
> - Elle ne communique qu'avec le portail SBEE : aucune donnée vers des tiers, aucune publicité, aucune statistique.
> - Sur les sites qui ne correspondent à aucune application attribuée, elle ne fait rien.
> - Chaque remplissage est journalisé par le portail.
>
> Prérequis : un compte agent sur le portail SBEE. Sans compte, l'extension n'a aucune utilité.
>
> Politique de confidentialité : https://portail.sbee.bj/extension/confidentialite

Remplacer `https://portail.sbee.bj` par l'adresse réelle du portail de production si elle diffère.

## Catégorie suggérée

| Boutique | Catégorie |
| --- | --- |
| Microsoft Edge Add-ons | Productivité (Productivity) |
| addons.opera.com | Productivité (Productivity) |
| addons.mozilla.org | Sans objet en distribution non répertoriée (si un jour répertoriée : « Confidentialité et sécurité ») |
| Chrome Web Store (si publiée) | Productivité > Outils de travail (Workflow & Planning) |

## Justification des permissions

Edge (champ « Notes de certification ») et Opera (champ « Notes pour le relecteur ») demandent pourquoi chaque permission est nécessaire. Texte proposé :

### `host_permissions: <all_urls>` (accès à tous les sites) - point principal

> L'extension remplit la page de connexion des applications métier attribuées aux agents de la SBEE. Ces applications sont nombreuses, hébergées sur des domaines variés (serveurs internes, adresses IP privées, prestataires externes, services en ligne) et la liste évolue : elle est définie par la DSI dans le portail SBEE et transmise à l'extension après la connexion de l'agent. Les domaines ne sont donc pas connus au moment de la publication et ne peuvent pas être listés dans le manifeste.
>
> Usage réel de l'accès :
> - le script injecté sur chaque page (`content-app.js`) demande d'abord au background si l'adresse correspond au motif de la page de connexion d'une application attribuée (`login_url_pattern`). Si ce n'est pas le cas, il s'arrête sans lire ni modifier la page ;
> - si l'adresse correspond, il remplit le champ identifiant et le champ mot de passe du formulaire, et propose l'enregistrement des identifiants saisis à la main ;
> - aucune donnée de navigation (historique, contenu de page, adresses visitées) n'est collectée ni transmise.
>
> `activeTab` ne suffit pas : le remplissage doit être automatique au chargement de la page de connexion, sans clic sur l'icône, y compris dans les iframes de connexion et pour les connexions en deux étapes. Les permissions facultatives demandées domaine par domaine ne conviennent pas non plus : la liste des applications change côté portail sans nouvelle version de l'extension, et les agents ne sont pas en mesure de juger des domaines à autoriser.

### `content_scripts` sur le portail

> `content-portail.js` n'est injecté que sur l'adresse du portail SBEE. Il sert de pont `window.postMessage` entre la page du portail et l'extension pour transmettre le jeton d'accès au coffre. Les messages sont acceptés uniquement depuis l'origine exacte du portail.

### `tabs`

> Lire l'adresse de l'onglet actif pour afficher dans la fenêtre de l'extension l'application reconnue et permettre le remplissage manuel ; ouvrir le portail et sa page de confidentialité depuis la fenêtre ; retrouver un onglet du portail ouvert pour demander un nouveau jeton à son expiration.

### `storage`

> Conserver en `storage.session` (effacé à la fermeture du navigateur) le jeton d'accès au coffre (8 heures), la configuration (applications attribuées) et, 60 secondes au plus, une proposition d'enregistrement en attente. `storage.local` ne contient qu'un identifiant d'installation aléatoire, qui n'est pas un secret.

### `alarms`

> Recharger la configuration toutes les 10 minutes et effacer les propositions d'enregistrement expirées, sans garder le service worker actif.

### Collecte de données (formulaires des boutiques et Firefox)

- Données traitées : identifiants de connexion (identifiant et mot de passe) des applications attribuées, envoyés uniquement au coffre du portail SBEE (serveur de la SBEE), à la demande de l'agent.
- Firefox : le manifeste déclare `data_collection_permissions.required: ["authenticationInfo"]`.
- Pas de vente, pas de transfert à des tiers, pas d'usage sans rapport avec la finalité, pas d'évaluation de solvabilité.
- Code distant : aucun. Tout le code est inclus dans le paquet ; l'extension n'exécute aucun script téléchargé.
- Politique de confidentialité : `https://portail.sbee.bj/extension/confidentialite`.

## Notes pour les relecteurs

Texte à adapter (remplacer les valeurs entre chevrons) et à coller dans le champ prévu de chaque boutique :

> Extension interne de la SBEE (Société Béninoise d'Énergie Électrique) destinée à ses agents. Elle nécessite un compte sur le portail SBEE.
>
> Adresse du portail : <https://portail.sbee.bj>
> Compte de démonstration (fourni par la DSI, droits limités, données fictives) : matricule <...>, mot de passe <...>.
> Application de démonstration attribuée à ce compte : <nom>, page de connexion <adresse>.
>
> Pour tester :
> 1. Installer l'extension, puis se connecter au portail avec le compte de démonstration. L'icône de l'extension indique « connecté ».
> 2. Dans le portail, ouvrir « Mes identifiants » : l'application de démonstration y figure.
> 3. Ouvrir la page de connexion de l'application de démonstration : l'identifiant et le mot de passe sont remplis automatiquement.
> 4. Cliquer sur l'icône de l'extension : la fenêtre affiche l'application reconnue et le bouton « Remplir maintenant ».
> 5. Se déconnecter du portail : l'extension est déconnectée et ne remplit plus rien.
> 6. Sur tout autre site, l'extension ne fait rien.
>
> Le code livré est compacté par esbuild. Archive des sources jointe (sbee-extension-source.zip) ; construction : Node.js 22, `npm ci`, puis `PORTAL_ORIGINS=<https://portail.sbee.bj> npm run build` ; résultat dans dist/chromium et dist/firefox. Instructions complètes dans README.md, section « Construire depuis les sources ».

Le compte de démonstration ne doit donner accès qu'à une application de test, sans donnée réelle. Le communiquer uniquement dans le champ privé des notes aux relecteurs, jamais dans la description publique, et le désactiver après la revue.

## Visuels

| Fichier | Taille | Usage |
| --- | --- | --- |
| `store/assets/icone-300x300.png` | 300 x 300 | Logo de la fiche Edge (obligatoire) |
| `store/assets/tuile-440x280.png` | 440 x 280 | Petite vignette promotionnelle (Edge, Chrome) ; image de fiche Opera |
| `icons/icon-128.png` | 128 x 128 | Icône de la fiche Opera et Firefox |

Ces fichiers sont produits par `npm run icons` à partir du logo officiel `public/images/logo.png`, sans le modifier.

## Captures à fournir (1280 x 800, PNG)

À réaliser par la DSI avec le compte de démonstration, en navigateur à 100 %, sans donnée réelle (ni nom d'agent réel, ni mot de passe lisible, ni adresse interne sensible) :

1. **Fenêtre de l'extension, connecté** : la page de connexion de l'application de démonstration en arrière-plan, la fenêtre ouverte avec « Connecté au portail : ... », « Application reconnue : ... » et le bouton « Remplir maintenant ».
2. **Page de connexion remplie** : le formulaire de l'application de démonstration avec l'identifiant visible et le mot de passe masqué, juste après le remplissage automatique.
3. **Proposition d'enregistrement** : après une connexion saisie à la main, la carte « Enregistrer ces identifiants dans votre coffre SBEE ? » avec ses boutons.
4. **Coffre du portail** : la page « Mes identifiants » du portail listant l'application de démonstration (mots de passe masqués).
5. **Installation et confidentialité** : la page « Installer l'extension » du portail avec le lien vers la politique de confidentialité, ou la fenêtre de l'extension « Non connecté » avec le bouton « Ouvrir le portail ».
