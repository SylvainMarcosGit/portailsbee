// Construit dist/chromium et dist/firefox à partir d'une seule base de code.
// PORTAL_ORIGINS (liste séparée par des virgules, défaut http://127.0.0.1:8000,http://localhost:8000)
// est figé dans le code à la construction. PORTAL_ORIGIN (singulier) reste accepté s'il est seul.
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_SIZES, generateIcons } from './icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

// Validation des origines : même code que l'extension (src/lib/origins.ts), compilé à la volée.
async function loadOrigins() {
  const out = await build({
    entryPoints: [join(ROOT, 'src/lib/origins.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  const code = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

const origins = await loadOrigins();
let PORTAL_ORIGINS;
try {
  PORTAL_ORIGINS = origins.resolvePortalOrigins(process.env);
} catch (err) {
  console.error(`PORTAL_ORIGINS : ${err.message}`);
  process.exit(1);
}
if (!process.env.PORTAL_ORIGINS?.trim() && process.env.PORTAL_ORIGIN?.trim()) {
  console.warn('PORTAL_ORIGIN (singulier) est obsolète : utilisez PORTAL_ORIGINS.');
}
// Chromium accepte un port dans les motifs de correspondance, Firefox non : pour Firefox
// on cible l'hôte. Dans tous les cas content-portail vérifie l'origine exacte à l'exécution.
const portalMatchesChromium = origins.uniqueMatches(PORTAL_ORIGINS, origins.chromiumMatch);
const portalMatchesFirefox = origins.uniqueMatches(PORTAL_ORIGINS, origins.firefoxMatch);

const icons = Object.fromEntries(ICON_SIZES.map((s) => [String(s), `icons/icon-${s}.png`]));

const baseManifest = {
  manifest_version: 3,
  name: "Coffre d'identifiants SBEE",
  short_name: 'Coffre SBEE',
  version: pkg.version,
  description: 'Remplit vos connexions aux applications SBEE à partir du coffre chiffré du portail SBEE. Réservée aux agents de la SBEE.',
  icons,
  action: { default_title: 'Coffre SBEE', default_popup: 'popup.html', default_icon: icons },
  permissions: ['storage', 'alarms', 'tabs'],
  host_permissions: ['<all_urls>'],
  // Icône de l'écran « Connexion invisible », affichée dans la page de connexion de l'application.
  web_accessible_resources: [{ resources: ['icons/icon-48.png'], matches: ['<all_urls>'] }],
};

const contentScripts = (portalMatches) => [
  { matches: portalMatches, js: ['content-portail.js'], run_at: 'document_start', all_frames: false },
  // Avant content-app : masque la page de connexion en mode « Connexion invisible ».
  { matches: ['<all_urls>'], js: ['content-guard.js'], run_at: 'document_start', all_frames: false },
  { matches: ['<all_urls>'], js: ['content-app.js'], run_at: 'document_idle', all_frames: true },
];

const targets = {
  chromium: {
    ...baseManifest,
    content_scripts: contentScripts(portalMatchesChromium),
    minimum_chrome_version: '109',
    background: { service_worker: 'background.js' },
  },
  firefox: {
    ...baseManifest,
    content_scripts: contentScripts(portalMatchesFirefox),
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'extension@sbee.bj',
        strict_min_version: '115.0',
        // Déclaration exigée par addons.mozilla.org : les identifiants saisis peuvent être
        // enregistrés dans le coffre du portail SBEE (aucun tiers). Ignoré avant Firefox 140.
        data_collection_permissions: { required: ['authenticationInfo'] },
      },
    },
  },
};

const iconsDir = join(ROOT, 'icons');
if (!ICON_SIZES.every((s) => existsSync(join(iconsDir, `icon-${s}.png`)))) await generateIcons(iconsDir);

for (const [name, manifest] of Object.entries(targets)) {
  const out = join(ROOT, 'dist', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'icons'), { recursive: true });

  await build({
    entryPoints: {
      background: join(ROOT, 'src/background.ts'),
      'content-portail': join(ROOT, 'src/content-portail.ts'),
      'content-guard': join(ROOT, 'src/content-guard.ts'),
      'content-app': join(ROOT, 'src/content-app.ts'),
      popup: join(ROOT, 'src/popup.ts'),
    },
    outdir: out,
    bundle: true,
    format: 'iife',
    target: name === 'firefox' ? ['firefox115'] : ['chrome109'],
    platform: 'browser',
    minify: process.env.NODE_ENV !== 'development',
    sourcemap: false,
    legalComments: 'none',
    charset: 'utf8',
    define: {
      __PORTAL_ORIGINS__: JSON.stringify(PORTAL_ORIGINS),
      __VERSION__: JSON.stringify(pkg.version),
    },
    logLevel: 'warning',
  });

  copyFileSync(join(ROOT, 'src/popup.html'), join(out, 'popup.html'));
  copyFileSync(join(ROOT, 'src/popup.css'), join(out, 'popup.css'));
  for (const s of ICON_SIZES) copyFileSync(join(iconsDir, `icon-${s}.png`), join(out, 'icons', `icon-${s}.png`));
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`dist/${name} construit (PORTAL_ORIGINS=${PORTAL_ORIGINS.join(',')})`);
}
