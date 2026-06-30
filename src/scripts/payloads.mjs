// Writes one starter payload JSON per product+format into
// assets/exports/creatomate-payloads/. Prefers the clean sample image.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadManifest, loadRules } from '../lib/load.mjs';
import { buildPayload } from '../lib/payload.mjs';

const OUT = join(ROOT, 'assets', 'exports', 'creatomate-payloads');
mkdirSync(OUT, { recursive: true });

const { products } = loadManifest();
const rules = loadRules();
let written = 0;

for (const p of products) {
  const clean = `assets/sample/${p.id}-clean.svg`;
  const imagePath = existsSync(join(ROOT, clean)) ? clean : (p.sourceImagePaths[0] ?? clean);
  for (const format of ['square', 'vertical']) {
    const payload = buildPayload(p, format, imagePath, rules);
    writeFileSync(join(OUT, `${p.id}-${format}.json`), JSON.stringify(payload, null, 2) + '\n');
    written++;
  }
}
console.log(`Generated ${written} payload(s) in assets/exports/creatomate-payloads/.`);
