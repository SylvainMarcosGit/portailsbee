// Construit dist/chromium et dist/firefox à partir d'une seule base de code.
// PORTAL_ORIGIN (défaut http://127.0.0.1:8000) est figé dans le code à la construction.
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_SIZES, generateIcons } from './icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function resolveOrigin(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`PORTAL_ORIGIN invalide : ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('PORTAL_ORIGIN doit être en http ou https.');
  if (url.pathname !== '/' || url.search || url.hash) {
    console.warn(`PORTAL_ORIGIN : seule l'origine est conservée (${url.origin}).`);
  }
  return url;
}

const portal = resolveOrigin(process.env.PORTAL_ORIGIN || 'http://127.0.0.1:8000');
const PORTAL_ORIGIN = portal.origin;
// Chromium accepte un port dans les motifs de correspondance, Firefox non : pour Firefox
// on cible l'hôte. Dans tous les cas content-portail vérifie l'origine exacte à l'exécution.
const portalMatchChromium = `${PORTAL_ORIGIN}/*`;
const portalMatchFirefox = `${portal.protocol}//${portal.hostname}/*`;

const icons = Object.fromEntries(ICON_SIZES.map((s) => [String(s), `icons/icon-${s}.png`]));

const baseManifest = {
  manifest_version: 3,
  name: "SBEE - Coffre d'identifiants",
  short_name: 'Coffre SBEE',
  version: pkg.version,
  description: 'Remplit vos connexions aux applications SBEE à partir du coffre du portail.',
  icons,
  action: { default_title: 'Coffre SBEE', default_popup: 'popup.html', default_icon: icons },
  permissions: ['storage', 'alarms', 'tabs'],
  host_permissions: ['<all_urls>'],
};

const contentScripts = (portalMatch) => [
  { matches: [portalMatch], js: ['content-portail.js'], run_at: 'document_start', all_frames: false },
  { matches: ['<all_urls>'], js: ['content-app.js'], run_at: 'document_idle', all_frames: true },
];

const targets = {
  chromium: {
    ...baseManifest,
    content_scripts: contentScripts(portalMatchChromium),
    minimum_chrome_version: '109',
    background: { service_worker: 'background.js' },
  },
  firefox: {
    ...baseManifest,
    content_scripts: contentScripts(portalMatchFirefox),
    background: { scripts: ['background.js'] },
    browser_specific_settings: { gecko: { id: 'extension@sbee.bj', strict_min_version: '115.0' } },
  },
};

const iconsDir = join(ROOT, 'icons');
if (!ICON_SIZES.every((s) => existsSync(join(iconsDir, `icon-${s}.png`)))) generateIcons(iconsDir);

for (const [name, manifest] of Object.entries(targets)) {
  const out = join(ROOT, 'dist', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'icons'), { recursive: true });

  await build({
    entryPoints: {
      background: join(ROOT, 'src/background.ts'),
      'content-portail': join(ROOT, 'src/content-portail.ts'),
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
      __PORTAL_ORIGIN__: JSON.stringify(PORTAL_ORIGIN),
      __VERSION__: JSON.stringify(pkg.version),
    },
    logLevel: 'warning',
  });

  copyFileSync(join(ROOT, 'src/popup.html'), join(out, 'popup.html'));
  copyFileSync(join(ROOT, 'src/popup.css'), join(out, 'popup.css'));
  for (const s of ICON_SIZES) copyFileSync(join(iconsDir, `icon-${s}.png`), join(out, 'icons', `icon-${s}.png`));
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`dist/${name} construit (PORTAL_ORIGIN=${PORTAL_ORIGIN})`);
}
