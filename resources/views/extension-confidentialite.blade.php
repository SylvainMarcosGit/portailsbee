<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de confidentialité de l'extension - SBEE</title>
    <meta name="description" content="Politique de confidentialité de l'extension navigateur « Coffre d'identifiants SBEE » : données traitées, permissions, conservation et droits.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --rouge: #ED1F24;
            --texte: #111111;
            --texte-2: #555555;
            --bordure: #E5E5E5;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; }
        body {
            background: #FFFFFF;
            color: var(--texte);
            font: 16px/1.65 'Poppins', 'Century Gothic', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        .page { max-width: 820px; margin: 0 auto; padding: 32px 16px 56px; }
        .entete {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 8px 0 8px 20px;
            border-left: 3px solid var(--rouge);
            margin-bottom: 32px;
        }
        .entete img { width: 56px; height: auto; flex-shrink: 0; }
        .surtitre { margin: 0; font-size: 13px; font-weight: 500; color: var(--texte-2); }
        h1 { margin: 4px 0 0; font-size: 26px; line-height: 1.3; font-weight: 600; color: var(--rouge); }
        .maj { margin: 8px 0 0; font-size: 14px; color: var(--texte-2); }
        h2 {
            margin: 40px 0 12px;
            padding-bottom: 8px;
            font-size: 19px;
            font-weight: 600;
            color: var(--rouge);
            border-bottom: 1px solid var(--rouge);
        }
        h3 { margin: 20px 0 6px; font-size: 16px; font-weight: 600; color: var(--texte); }
        p, li { color: var(--texte); }
        ul { padding-left: 22px; margin: 8px 0 16px; }
        li { margin: 6px 0; }
        .note { color: var(--texte-2); font-size: 14px; }
        code {
            font-family: Consolas, 'Courier New', monospace;
            font-size: 14px;
            background: #F5F5F5;
            border: 1px solid var(--bordure);
            border-radius: 3px;
            padding: 1px 5px;
        }
        a { color: var(--texte); text-decoration: underline; text-underline-offset: 2px; }
        a:hover { color: var(--texte-2); }
        a:focus-visible { outline: 2px solid var(--texte); outline-offset: 2px; }
        .tableau { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 15px; }
        .tableau th, .tableau td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--bordure); }
        .tableau th { font-weight: 600; color: var(--texte-2); font-size: 14px; }
        .tableau td:first-child { white-space: nowrap; font-weight: 500; }
        .contact { border-left: 3px solid var(--rouge); padding: 4px 0 4px 16px; margin: 12px 0; }
        .contact p { margin: 2px 0; }
        footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--bordure); font-size: 13px; color: var(--texte-2); }
        @media (max-width: 600px) {
            h1 { font-size: 22px; }
            .entete { gap: 14px; padding-left: 14px; }
            .entete img { width: 44px; }
            .tableau td:first-child { white-space: normal; }
        }
    </style>
</head>
<body>
<main class="page">
    <header class="entete">
        <img src="/images/logo.png" alt="Logo de la SBEE" width="283" height="334">
        <div>
            <p class="surtitre">Société Béninoise d'Énergie Électrique</p>
            <h1>Politique de confidentialité de l'extension</h1>
            <p class="maj">Extension navigateur « Coffre d'identifiants SBEE » - mise à jour le 7 octobre 2026</p>
        </div>
    </header>

    <p>
        Cette page décrit les données traitées par l'extension navigateur « Coffre d'identifiants SBEE »
        (Microsoft Edge, Google Chrome, Opera et Mozilla Firefox), pourquoi elles le sont, où elles sont conservées
        et comment exercer vos droits.
    </p>

    <h2>Responsable du traitement</h2>
    <div class="contact">
        <p><strong>Société Béninoise d'Énergie Électrique (SBEE)</strong>, Direction Générale</p>
        <p>01 BP 123 Ave. du Gouv. Gén. Ponty, Cotonou - Bénin</p>
        <p>Courriel : <a href="mailto:info@sbee.bj">info@sbee.bj</a></p>
    </div>

    <h2>Finalité</h2>
    <p>
        L'extension sert uniquement à préremplir, et si l'application est configurée pour, à valider la page de connexion
        des applications que la SBEE a attribuées à l'agent dans le portail SBEE. Elle ne sert à aucune autre fin.
        Elle n'est utile qu'aux agents disposant d'un compte sur le portail SBEE.
    </p>

    <h2>Données traitées</h2>
    <h3>Dans le coffre du portail SBEE (serveur de la SBEE)</h3>
    <ul>
        <li>
            L'identifiant et le mot de passe de chaque application attribuée, enregistrés par l'agent (depuis le portail ou
            après acceptation de la proposition « Enregistrer ces identifiants dans votre coffre SBEE ? »).
            Le mot de passe est chiffré en AES-256-GCM avant d'être enregistré.
        </li>
    </ul>
    <h3>Dans le navigateur</h3>
    <ul>
        <li>
            En mémoire de session du navigateur (<code>storage.session</code>, effacée à la fermeture du navigateur) :
            un jeton d'accès au coffre valable 8 heures, la configuration (applications attribuées, adresses de leurs pages
            de connexion, identifiant de connexion) et, pendant 60 secondes au plus, des identifiants saisis à la main
            en attente de votre réponse à la proposition d'enregistrement.
        </li>
        <li>
            Une empreinte non réversible (SHA-256) des derniers identifiants utilisés, en mémoire de session, pour éviter
            de vous proposer d'enregistrer des identifiants déjà connus.
        </li>
        <li>
            Un identifiant d'installation aléatoire (stockage local de l'extension), qui n'est pas un secret : il permet au
            portail de distinguer vos navigateurs reliés.
        </li>
    </ul>
    <p>Aucun mot de passe n'est écrit dans le stockage permanent du navigateur ni dans les journaux.</p>

    <h3>Ce que l'extension ne fait pas</h3>
    <ul>
        <li>Aucune donnée n'est transmise à des tiers : l'extension ne communique qu'avec le portail SBEE.</li>
        <li>Aucune publicité, aucune statistique d'usage, aucun outil de mesure d'audience.</li>
        <li>Aucune collecte de l'historique de navigation : sur les sites qui ne correspondent à aucune application attribuée, l'extension ne fait rien.</li>
        <li>Aucune revente ni réutilisation des données à d'autres fins.</li>
    </ul>

    <h2>Permissions demandées et pourquoi</h2>
    <table class="tableau">
        <thead>
        <tr><th scope="col">Permission</th><th scope="col">Utilisation</th></tr>
        </thead>
        <tbody>
        <tr>
            <td>Accès à tous les sites</td>
            <td>
                Les applications attribuées aux agents sont hébergées sur des domaines variés (internes et externes) qui ne
                sont pas connus à l'avance. L'extension vérifie l'adresse de la page : elle n'agit que si cette adresse
                correspond à la page de connexion d'une application attribuée, et reste inactive partout ailleurs.
            </td>
        </tr>
        <tr>
            <td>Onglets</td>
            <td>
                Connaître l'adresse de l'onglet actif pour indiquer dans la fenêtre de l'extension l'application reconnue,
                ouvrir le portail et retrouver un onglet du portail ouvert pour renouveler le jeton.
            </td>
        </tr>
        <tr>
            <td>Stockage</td>
            <td>Conserver le jeton et la configuration en mémoire de session, et l'identifiant d'installation.</td>
        </tr>
        <tr>
            <td>Alarmes</td>
            <td>Recharger la configuration toutes les 10 minutes et effacer les propositions d'enregistrement expirées.</td>
        </tr>
        </tbody>
    </table>

    <h2>Journalisation</h2>
    <p>
        Chaque remise d'identifiants par le coffre en vue d'un remplissage est journalisée par le portail SBEE (agent,
        application, date et heure), à des fins de sécurité et de traçabilité. Le mot de passe n'apparaît jamais
        dans ce journal.
    </p>

    <h2>Durée de conservation</h2>
    <ul>
        <li>Les identifiants sont conservés dans le coffre tant que l'agent les garde enregistrés.</li>
        <li>L'agent peut les supprimer à tout moment depuis la page « Mes identifiants » du portail.</li>
        <li>
            Le jeton de l'extension est révoqué à la déconnexion du portail et expire au bout de 8 heures ; la mémoire de
            session est vidée à la déconnexion et à la fermeture du navigateur.
        </li>
        <li>La désactivation du compte de l'agent met fin à l'accès au coffre.</li>
    </ul>

    <h2>Vos droits</h2>
    <p>
        Conformément à la loi n° 2017-20 du 20 avril 2018 portant code du numérique en République du Bénin, vous disposez
        d'un droit d'accès, de rectification et de suppression des données vous concernant. Vous pouvez les exercer
        directement depuis la page « Mes identifiants » du portail, ou en écrivant à la SBEE :
    </p>
    <div class="contact">
        <p>SBEE, Direction Générale, 01 BP 123 Ave. du Gouv. Gén. Ponty, Cotonou - Bénin</p>
        <p>Courriel : <a href="mailto:info@sbee.bj">info@sbee.bj</a></p>
    </div>
    <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'Autorité de Protection des Données
        à caractère Personnel (APDP) du Bénin.
    </p>

    <h2>Modifications</h2>
    <p>
        Toute modification de cette politique est publiée sur cette page, avec sa nouvelle date de mise à jour.
    </p>

    <footer>
        <p>© SBEE - Société Béninoise d'Énergie Électrique. Dernière mise à jour : 7 octobre 2026.</p>
    </footer>
</main>
</body>
</html>
