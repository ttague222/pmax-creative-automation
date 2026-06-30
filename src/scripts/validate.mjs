// CLI: validates data/products.json against approved overlays + checks sample
// image files exist on disk (warnings only). Exit non-zero on schema errors.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadManifest, loadOverlays } from '../lib/load.mjs';
import { validateProducts } from '../lib/validate.mjs';

const { products = [] } = loadManifest();
const overlays = loadOverlays();
const approved = new Set([...overlays.trustOverlays, ...overlays.valueOverlays, ...overlays.ctaOverlays]);

const { errors, warnings } = validateProducts(products, approved);

for (const p of products) {
  for (const imgPath of p.sourceImagePaths ?? []) {
    if (!existsSync(join(ROOT, imgPath))) {
      warnings.push(`${p.id}: sample image not generated yet: ${imgPath} (run npm run demo)`);
    }
  }
}

console.log(`Validated ${products.length} product(s).\n`);
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) console.log(`  x ${e}`);
  console.log('');
}
if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log('');
}
if (!errors.length) console.log('Manifest is structurally valid.');
process.exit(errors.length ? 1 : 0);
