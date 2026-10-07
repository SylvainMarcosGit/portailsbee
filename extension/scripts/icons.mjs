// Génère des icônes PNG simples (16/32/48/128) : carré blanc, filet rouge
// #ED1F24 à gauche et lettres « SB » en pixels. Ce n'est PAS le logo SBEE.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ICON_SIZES = [16, 32, 48, 128];

const GLYPHS = {
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
};

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  const white = [255, 255, 255];
  const red = [0xed, 0x1f, 0x24];
  const ink = [0x11, 0x11, 0x11];
  const grey = [0xc0, 0xc0, 0xc0];

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, white);
  // contour gris fin (lisibilité sur fond clair)
  if (size >= 32) {
    for (let i = 0; i < size; i++) {
      set(i, 0, grey);
      set(i, size - 1, grey);
      set(size - 1, i, grey);
    }
  }
  // filet rouge à gauche
  const bar = Math.max(2, Math.round(size / 10));
  for (let y = 0; y < size; y++) for (let x = 0; x < bar; x++) set(x, y, red);

  // lettres « SB » : 5 + 1 + 5 colonnes, 7 lignes
  const avail = size - bar - Math.max(1, Math.round(size / 16)) * 2;
  const scale = Math.max(1, Math.floor(avail / 11));
  const w = 11 * scale;
  const h = 7 * scale;
  const x0 = bar + Math.floor((size - bar - w) / 2);
  const y0 = Math.floor((size - h) / 2);
  ['S', 'B'].forEach((letter, li) => {
    GLYPHS[letter].forEach((row, gy) => {
      [...row].forEach((c, gx) => {
        if (c !== '#') return;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) set(x0 + (li * 6 + gx) * scale + dx, y0 + gy * scale + dy, ink);
      });
    });
  });
  return png(size, px);
}

export function generateIcons(outDir = join(ROOT, 'icons')) {
  mkdirSync(outDir, { recursive: true });
  for (const s of ICON_SIZES) writeFileSync(join(outDir, `icon-${s}.png`), draw(s));
  return outDir;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(`Icônes générées dans ${generateIcons()}`);
}
