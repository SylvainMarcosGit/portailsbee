// Génère les icônes de l'extension et les visuels des boutiques à partir du logo
// officiel SBEE (../public/images/logo.png, jamais redessiné) :
// - icons/icon-{16,32,48,128}.png : logo centré, proportions conservées, carré à fond blanc, marge ~12 % ;
// - store/assets/tuile-440x280.png : image de fiche (logo + nom de l'extension) ;
// - store/assets/icone-300x300.png : icône de fiche Edge.
// Dépendance de dev : sharp (chargée seulement ici, pas nécessaire à npm run build si les icônes existent).
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = join(ROOT, '..', 'public', 'images', 'logo.png');
export const ICON_SIZES = [16, 32, 48, 128];
const MARGIN = 0.12;
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 255, g: 255, b: 255, alpha: 0 };
const EXTENSION_NAME = "Coffre d'identifiants SBEE";

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    throw new Error('sharp est introuvable : lancez npm install dans extension/ avant npm run icons.');
  }
}

/** Logo redimensionné pour tenir dans une boîte w x h, sans déformation, fond transparent. */
async function fittedLogo(sharp, w, h) {
  return sharp(LOGO)
    .resize({ width: w, height: h, fit: 'contain', background: TRANSPARENT, kernel: 'lanczos3' })
    .png()
    .toBuffer();
}

/** Carré blanc de côté size, logo centré avec une marge de MARGIN sur chaque bord. */
async function squareWithLogo(sharp, size) {
  const margin = Math.max(1, Math.round(size * MARGIN));
  const inner = size - 2 * margin;
  const logo = await fittedLogo(sharp, inner, inner);
  return sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: logo, left: margin, top: margin }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

/** Tuile 440 x 280 : fond blanc, logo à gauche, nom de l'extension en texte simple à droite. */
async function storeTile(sharp) {
  const W = 440;
  const H = 280;
  const logoH = 168;
  const logoW = Math.round((logoH * 283) / 334);
  const logoLeft = 40;
  const logoTop = Math.round((H - logoH) / 2);
  const logo = await fittedLogo(sharp, logoW, logoH);
  const textX = logoLeft + logoW + 28;
  const font = "Poppins, 'Segoe UI', Arial, sans-serif";
  // EXTENSION_NAME sur trois lignes : « Coffre », « d'identifiants », « SBEE ».
  const [l1, l2, l3] = ['Coffre', "d'identifiants", 'SBEE'];
  if (`${l1} ${l2} ${l3}` !== EXTENSION_NAME) throw new Error('Nom de la tuile à mettre à jour.');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="${textX}" y="128" font-family="${font}" font-size="24" font-weight="600" fill="#111111">${escapeXml(l1)}</text>
  <text x="${textX}" y="158" font-family="${font}" font-size="24" font-weight="600" fill="#111111">${escapeXml(l2)}</text>
  <text x="${textX}" y="188" font-family="${font}" font-size="24" font-weight="700" fill="#ED1F24">${escapeXml(l3)}</text>
</svg>`;
  return sharp({ create: { width: W, height: H, channels: 4, background: WHITE } })
    .composite([
      { input: logo, left: logoLeft, top: logoTop },
      { input: Buffer.from(svg), left: 0, top: 0 },
    ])
    .flatten({ background: WHITE })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function write(sharp, buffer, file) {
  mkdirSync(dirname(file), { recursive: true });
  await sharp(buffer).toFile(file);
  return file;
}

export async function generateIcons(outDir = join(ROOT, 'icons')) {
  if (!existsSync(LOGO)) throw new Error(`Logo officiel introuvable : ${LOGO}`);
  const sharp = await loadSharp();
  for (const s of ICON_SIZES) await write(sharp, await squareWithLogo(sharp, s), join(outDir, `icon-${s}.png`));
  return outDir;
}

export async function generateStoreAssets(outDir = join(ROOT, 'store', 'assets')) {
  if (!existsSync(LOGO)) throw new Error(`Logo officiel introuvable : ${LOGO}`);
  const sharp = await loadSharp();
  await write(sharp, await storeTile(sharp), join(outDir, 'tuile-440x280.png'));
  await write(sharp, await squareWithLogo(sharp, 300), join(outDir, 'icone-300x300.png'));
  return outDir;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(`Icônes générées dans ${await generateIcons()}`);
  console.log(`Visuels des boutiques générés dans ${await generateStoreAssets()}`);
}
