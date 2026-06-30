// Real mode: generates lifestyle scenes by replacing each product photo's
// background while keeping the product faithful (only the scene changes), via
// fal's bria/replace-background (trained on licensed data, commercial-safe).
// Key-gated on FAL_KEY. Needs a public https product image URL per product
// (set `imageUrl` in data/products.json — the same field render.mjs uses).
// Output: assets/processed/scenes/<id>-lifestyle.png
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadManifest } from '../lib/load.mjs';

const KEY = process.env.FAL_KEY;
if (!KEY) {
  console.error('Set FAL_KEY first (fal.ai → dashboard → API keys). This is real mode.');
  process.exit(1);
}
const ENDPOINT = 'https://queue.fal.run/bria/replace-background';
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Key ${KEY}` };

// Per-category default scene prompts; override per product with `scenePrompt` in the manifest.
const SCENE_BY_CATEGORY = {
  home: 'A modern bright living room with light wood flooring and a softly blurred sofa and plant, natural daylight, the product placed naturally with a realistic soft shadow, professional lifestyle photography, straight-on front angle',
  kitchen: 'On a clean modern kitchen counter with a subtly blurred backsplash and warm morning light, the product centered with a realistic reflection and shadow, professional lifestyle photography, straight-on front angle',
  audio: 'On a wooden side table in a stylish living room with soft blurred decor and warm light, the product centered with a realistic shadow, professional lifestyle photography, straight-on front angle',
};

const OUT = join(ROOT, 'assets', 'processed', 'scenes');
mkdirSync(OUT, { recursive: true });

const { products } = loadManifest();
for (const p of products) {
  if (!p.imageUrl) {
    console.log(`skip ${p.id}: set a public https imageUrl in data/products.json (the model fetches it).`);
    continue;
  }
  const prompt = p.scenePrompt || SCENE_BY_CATEGORY[p.category] || SCENE_BY_CATEGORY.home;

  const submit = await fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ image_url: p.imageUrl, prompt }) });
  if (!submit.ok) { console.error(`${p.id}: submit HTTP ${submit.status} ${(await submit.text()).slice(0, 200)}`); continue; }
  const { request_id: id } = await submit.json();

  let url = null;
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(`${ENDPOINT}/requests/${id}/status`, { headers: HEADERS });
    if (!st.ok) { console.error(`${p.id}: status HTTP ${st.status}`); break; }
    if ((await st.json()).status === 'COMPLETED') {
      const res = await fetch(`${ENDPOINT}/requests/${id}`, { headers: HEADERS });
      if (!res.ok) { console.error(`${p.id}: result HTTP ${res.status}`); break; }
      const rj = await res.json();
      url = rj.images?.[0]?.url ?? rj.image?.url ?? null;
      break;
    }
  }
  if (!url) { console.error(`${p.id}: no scene produced (timeout or error)`); continue; }
  const dl = await fetch(url);
  if (!dl.ok) { console.error(`${p.id}: download HTTP ${dl.status}`); continue; }
  writeFileSync(join(OUT, `${p.id}-lifestyle.png`), Buffer.from(await dl.arrayBuffer()));
  console.log(`scene ${p.id} → assets/processed/scenes/${p.id}-lifestyle.png`);
}
console.log('Lifestyle scene pass done.');
