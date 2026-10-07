// Zippe dist/chromium et dist/firefox vers ../public/extension/ (servis par le portail).
import archiver from 'archiver';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '..', 'public', 'extension');

function zipDir(src, dest) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(dest);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(src, false); // manifest.json à la racine du zip
    void archive.finalize();
  });
}

mkdirSync(OUT, { recursive: true });
for (const target of ['chromium', 'firefox']) {
  const src = join(ROOT, 'dist', target);
  if (!existsSync(join(src, 'manifest.json'))) throw new Error(`dist/${target} absent : lancez npm run build.`);
  const dest = join(OUT, `sbee-extension-${target}.zip`);
  await zipDir(src, dest);
  console.log(`${dest} (${statSync(dest).size} octets)`);
}
