// Archive des sources pour la relecture des boutiques (Firefox et Opera l'exigent :
// le code livré est compacté). Produit ../public/extension/sbee-extension-source.zip,
// sans node_modules ni dist.
import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '..', 'public', 'extension');
const DEST = join(OUT, 'sbee-extension-source.zip');

const DIRS = ['src', 'scripts', 'icons', 'store', 'tests'];
const FILES = ['package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts', 'README.md', '.gitignore'];
const REQUIRED = ['src', 'scripts', 'icons', 'package.json', 'package-lock.json', 'tsconfig.json', 'README.md'];

for (const item of REQUIRED) {
  if (!existsSync(join(ROOT, item))) throw new Error(`${item} absent : archive des sources impossible.`);
}

mkdirSync(OUT, { recursive: true });
await new Promise((resolve, reject) => {
  const output = createWriteStream(DEST);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolve);
  archive.on('error', reject);
  archive.on('warning', reject);
  archive.pipe(output);
  for (const dir of DIRS) {
    if (existsSync(join(ROOT, dir))) {
      archive.glob('**/*', { cwd: join(ROOT, dir), dot: false, ignore: ['**/node_modules/**', '**/dist/**', '**/*.zip'] }, { prefix: dir });
    }
  }
  for (const file of FILES) if (existsSync(join(ROOT, file))) archive.file(join(ROOT, file), { name: file });
  void archive.finalize();
});
console.log(`${DEST} (${statSync(DEST).size} octets)`);
