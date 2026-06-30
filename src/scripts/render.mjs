// Real mode: renders square + vertical PMAX videos via the Creatomate API
// (RenderScript — no template/editor needed) into assets/processed/videos/.
// Requires CREATOMATE_API_KEY. Image sources must be PUBLIC https URLs
// (Creatomate downloads them; data URIs/local files are rejected) — set an
// `imageUrl` per product in data/products.json, or host your processed images
// and add their URLs there.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadManifest, loadBrand } from '../lib/load.mjs';

const KEY = process.env.CREATOMATE_API_KEY;
if (!KEY) {
  console.error('Set CREATOMATE_API_KEY first (creatomate.com → Project settings → API). This is real mode.');
  process.exit(1);
}
const API = 'https://api.creatomate.com/v2/renders';
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}`, 'User-Agent': 'curl/8.9.1' };
const BRAND = (loadBrand().name || 'Brand');

const INK = 'rgba(28,37,40,1)', ACCENT = 'rgba(14,124,102,1)', WHITE = 'rgba(255,255,255,1)', END_BG = 'rgba(27,28,30,1)';
const fadeIn = (at = 0) => [{ time: at, duration: 0.6, easing: 'quadratic-out', type: 'fade' }];

function text(name, t, y, w, size, color, { weight = '700', bg, anims } = {}) {
  const el = { name, type: 'text', text: t, x: '50%', y, width: w, height: '10%', x_alignment: '50%', y_alignment: '50%', fill_color: color, font_family: 'Montserrat', font_weight: weight, font_size: size };
  if (bg) Object.assign(el, { background_color: bg, background_x_padding: '60%', background_y_padding: '30%', background_border_radius: '18%' });
  if (anims) el.animations = anims;
  return el;
}

function build(p, vertical) {
  const [W, H] = vertical ? [1080, 1920] : [1080, 1080];
  const [s1, s2, s3] = vertical ? [5, 4, 3] : [4, 3.5, 2.5];
  const sz = (v, s) => (vertical ? v : s) + ' px';
  return {
    output_format: 'mp4', width: W, height: H, frame_rate: 30, render_scale: 1,
    elements: [
      { type: 'composition', track: 1, duration: s1, fill_color: WHITE, elements: [
        { name: 'product-image', type: 'image', source: p.imageUrl, y: vertical ? '47%' : '50%', height: vertical ? '52%' : '62%', fit: 'contain',
          animations: [{ time: 0, duration: s1, type: 'scale', start_scale: '100%', end_scale: '105%', fade: false }] },
        text('product-title', p.shortTitle, vertical ? '14%' : '10%', '84%', sz(42, 38), INK, { anims: fadeIn(0.5) }),
      ]},
      { type: 'composition', track: 1, duration: s2, fill_color: WHITE, animations: [{ time: 0, duration: 0.7, transition: true, type: 'fade' }], elements: [
        { name: 'product-image-2', type: 'image', source: p.imageUrl, y: vertical ? '40%' : '42%', height: vertical ? '46%' : '52%', fit: 'contain' },
        text('trust-overlay-1', p.trustBadges[0], vertical ? '72%' : '74%', '70%', sz(34, 30), WHITE, { bg: ACCENT, anims: fadeIn(0.2) }),
        text('trust-overlay-2', p.trustBadges[1] ?? '', vertical ? '80%' : '84%', '70%', sz(34, 30), WHITE, { bg: ACCENT, anims: fadeIn(0.5) }),
        text('price-text', p.priceText ?? '', vertical ? '89%' : '94%', '70%', sz(52, 44), INK, { anims: fadeIn(0.8) }),
      ]},
      { type: 'composition', track: 1, duration: s3, fill_color: END_BG, animations: [{ time: 0, duration: 0.7, transition: true, type: 'fade' }], elements: [
        text('brand', BRAND.toUpperCase(), vertical ? '42%' : '40%', '80%', '64 px', WHITE, { weight: '800' }),
        text('cta-text', p.cta, vertical ? '54%' : '56%', '84%', sz(44, 38), WHITE, { bg: ACCENT, anims: fadeIn(0.3) }),
      ]},
    ],
  };
}

const { products } = JSON.parse(readFileSync(join(ROOT, 'data/products.json'), 'utf8'));
const jobs = [];
for (const product of products) {
  const imageUrl = product.imageUrl;
  if (!imageUrl) { console.log(`skip ${product.id}: no public imageUrl set in data/products.json (real mode needs a hosted https image).`); continue; }
  const p = { ...product, imageUrl, shortTitle: product.title.replace(/,.*?—/, ' —').replace(/ - /, ' — ') };
  for (const vertical of [false, true]) {
    const res = await fetch(API, { method: 'POST', headers: HEADERS, body: JSON.stringify(build(p, vertical)) });
    if (!res.ok) { console.error(`${product.id} ${vertical ? 'vertical' : 'square'}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); continue; }
    const data = await res.json();
    const job = Array.isArray(data) ? data[0] : data;
    jobs.push({ id: product.id, fmt: vertical ? 'vertical' : 'square', renderId: job.id });
    console.log(`submitted ${product.id}-${vertical ? 'vertical' : 'square'}: ${job.id}`);
  }
}

mkdirSync(join(ROOT, 'assets/processed/videos'), { recursive: true });
const pending = new Map(jobs.map((j) => [j, null]));
while (pending.size) {
  await new Promise((r) => setTimeout(r, 10000));
  for (const job of [...pending.keys()]) {
    const st = await (await fetch(`${API}/${job.renderId}`, { headers: HEADERS })).json();
    if (st.status === 'succeeded') {
      writeFileSync(join(ROOT, 'assets/processed/videos', `${job.id}-${job.fmt}.mp4`), Buffer.from(await (await fetch(st.url)).arrayBuffer()));
      console.log(`saved ${job.id}-${job.fmt}.mp4 (${st.width}x${st.height})`);
      pending.delete(job);
    } else if (st.status === 'failed') {
      console.error(`${job.id}-${job.fmt} FAILED: ${(st.error_message || '').slice(0, 200)}`);
      pending.delete(job);
    }
  }
}
console.log('Done.');
