// Real mode: removes/standardizes backgrounds via the Photoroom API for each
// product's first source image, writing assets/processed/images/<id>-clean.png.
// Bring your own raster product photos (PNG/JPG) referenced in data/products.json
// — the bundled .svg samples are for mock mode only and are skipped here.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ROOT, loadManifest } from '../lib/load.mjs';

const KEY = process.env.PHOTOROOM_API_KEY;
if (!KEY) {
  console.error('Set PHOTOROOM_API_KEY first (photoroom.com/api → Account → API Keys). This is real mode.');
  process.exit(1);
}
const OUT = join(ROOT, 'assets', 'processed', 'images');
mkdirSync(OUT, { recursive: true });

const { products } = loadManifest();
for (const p of products) {
  const src = p.sourceImagePaths?.[0];
  if (!src || extname(src).toLowerCase() === '.svg') {
    console.log(`skip ${p.id}: provide a raster source photo (PNG/JPG) in data/products.json for real mode.`);
    continue;
  }
  const abs = join(ROOT, src);
  if (!existsSync(abs)) { console.log(`skip ${p.id}: source not found: ${src}`); continue; }

  const form = new FormData();
  form.append('image_file', new Blob([readFileSync(abs)]), src.split('/').pop());
  form.append('bg_color', 'F4F6F6'); // neutral premium background per creative-rules
  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST', headers: { 'x-api-key': KEY }, body: form,
  });
  if (!res.ok) { console.error(`${p.id}: Photoroom HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); continue; }
  writeFileSync(join(OUT, `${p.id}-clean.png`), Buffer.from(await res.arrayBuffer()));
  console.log(`cleaned ${p.id} → assets/processed/images/${p.id}-clean.png`);
}
console.log('Photoroom pass done.');
