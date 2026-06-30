// Generates simple, self-contained SVG placeholder images for the sample
// catalog — a "source" (busy background) and a "clean" (neutral premium
// background) variant per product. No third-party assets, no network.
// Output: assets/sample/<id>-source.svg and assets/sample/<id>-clean.svg
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadManifest } from '../lib/load.mjs';

const OUT = join(ROOT, 'assets', 'sample');
mkdirSync(OUT, { recursive: true });

const SHAPES = {
  home: '<rect x="170" y="150" width="260" height="320" rx="28" fill="#cfd8d8"/><circle cx="300" cy="230" r="60" fill="#9fb4b2"/>',
  kitchen: '<rect x="190" y="170" width="220" height="300" rx="20" fill="#d7d2c8"/><rect x="250" y="230" width="100" height="90" rx="10" fill="#8a8170"/>',
  audio: '<rect x="210" y="150" width="180" height="340" rx="22" fill="#c8ccd6"/><circle cx="300" cy="260" r="55" fill="#6d7484"/><circle cx="300" cy="380" r="40" fill="#6d7484"/>',
};
const shapeFor = (cat) => SHAPES[cat] ?? SHAPES.home;
const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(product, clean) {
  const bg = clean
    ? '<rect width="600" height="600" fill="#f4f6f6"/>'
    : '<rect width="600" height="600" fill="#b9c3b0"/><rect x="0" y="430" width="600" height="170" fill="#8e9b86"/><circle cx="90" cy="90" r="70" fill="#a7b39d"/>';
  const label = clean ? 'CLEANED (simulated)' : 'SOURCE (simulated)';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${bg}
${shapeFor(product.category)}
<text x="300" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#1c2528">${escXml(product.id)}</text>
<text x="300" y="572" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#5a6568">${label}</text>
</svg>
`;
}

const { products } = loadManifest();
for (const p of products) {
  writeFileSync(join(OUT, `${p.id}-source.svg`), svg(p, false));
  writeFileSync(join(OUT, `${p.id}-clean.svg`), svg(p, true));
}
console.log(`Generated ${products.length * 2} sample SVG(s) in assets/sample/.`);
