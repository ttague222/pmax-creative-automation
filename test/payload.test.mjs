import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload } from '../src/lib/payload.mjs';

const product = {
  id: 'nw-001', title: 'Northwind AirPure 1400', category: 'home',
  productUrl: 'https://example-store.test/products/x',
  trustBadges: ['Certified Refurbished', 'Warranty Included'],
  conditionNotes: 'note', cta: 'Shop Certified Refurbished', priceText: '$159.99',
};
const rules = { version: 1, video: { maxDurationSeconds: 12, motionStyle: 'restrained' } };

test('payload maps product fields to template modifications', () => {
  const out = buildPayload(product, 'square', 'assets/sample/nw-001-clean.svg', rules);
  assert.equal(out.modifications['product-title'], 'Northwind AirPure 1400');
  assert.equal(out.modifications['product-image'], 'assets/sample/nw-001-clean.svg');
  assert.equal(out.modifications['trust-overlay-1'], 'Certified Refurbished');
  assert.equal(out.modifications['cta-text'], 'Shop Certified Refurbished');
});

test('payload carries creative-rules version + meta', () => {
  const out = buildPayload(product, 'vertical', 'img.svg', rules);
  assert.equal(out.meta.creativeRulesVersion, 1);
  assert.equal(out.meta.productId, 'nw-001');
  assert.equal(out.format, 'vertical');
});
