// Mock-mode gallery builder. Produces src/demo/demo-data.json and re-embeds it
// into src/demo/index.html (file:// fallback). No keys, no network. Exposes
// buildDemoProducts() for unit testing.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadManifest, loadBrand } from '../lib/load.mjs';

// Paths are relative to src/demo/ so the page resolves them via file://.
const rel = (p) => `../../${p}`;

export function buildDemoProducts(products) {
  return products.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    productUrl: p.productUrl,
    trustBadges: p.trustBadges,
    conditionNotes: p.conditionNotes,
    cta: p.cta,
    priceText: p.priceText ?? null,
    regularPriceText: p.regularPriceText ?? null,
    warrantyText: p.warrantyText ?? null,
    sourceImage: rel(`assets/sample/${p.id}-source.jpg`),
    cleanImage: rel(`assets/sample/${p.id}-clean.png`),
    storyboard: [
      { scene: 1, headline: p.title.split('—')[0].trim().slice(0, 80), note: 'Product reveal' },
      { scene: 2, headline: p.trustBadges.join(' · '), price: p.priceText ?? '', note: 'Trust + value' },
      { scene: 3, brand: '', cta: p.cta, note: 'End card' },
    ],
  }));
}

// Only run side effects when invoked directly (not when imported by tests).
// pathToFileURL handles Windows drive-letter encoding correctly (file:///C:/...).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { products } = loadManifest();
  const brand = loadBrand();
  const demoProducts = buildDemoProducts(products).map((dp) => ({
    ...dp,
    storyboard: dp.storyboard.map((s) => (s.scene === 3 ? { ...s, brand: brand.name } : s)),
  }));
  const demoData = { project: 'PMAX Creative Automation', brand: brand.name, products: demoProducts };
  const json = JSON.stringify(demoData, null, 2);

  writeFileSync(join(ROOT, 'src/demo/demo-data.json'), json + '\n');

  const htmlPath = join(ROOT, 'src/demo/index.html');
  const html = readFileSync(htmlPath, 'utf8');
  const start = '<script id="demo-data" type="application/json">';
  const end = '</script><!-- /demo-data -->';
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a === -1 || b === -1) { console.error('demo-data markers missing in index.html'); process.exit(1); }
  if (b <= a) { console.error('demo-data markers are out of order in index.html'); process.exit(1); }
  writeFileSync(htmlPath, html.slice(0, a + start.length) + '\n' + json + '\n' + html.slice(b));
  console.log(`Built demo gallery for ${demoProducts.length} product(s).`);
}
