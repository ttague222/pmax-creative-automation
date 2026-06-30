// Path + JSON helpers shared by lib modules and scripts.
// ROOT resolves to the repo root regardless of which script imports this.
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
}

export function loadManifest() {
  return loadJson('data/products.json');
}

export function loadOverlays() {
  return loadJson('config/overlay-copy.json');
}

export function loadRules() {
  return loadJson('config/creative-rules.json');
}

export function loadBrand() {
  return loadJson('config/brand.json');
}
