import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoProducts } from '../src/scripts/demo.mjs';

const products = [{
  id: 'nw-001', title: 'Sample', category: 'home',
  productUrl: 'https://example-store.test/products/x',
  trustBadges: ['Certified Refurbished'], conditionNotes: 'n',
  cta: 'Shop Certified Refurbished', priceText: '$1', regularPriceText: '$2', warrantyText: '90 Day Warranty',
}];

test('buildDemoProducts wires before/after sample image paths', () => {
  const out = buildDemoProducts(products);
  assert.equal(out[0].sourceImage, '../../assets/sample/nw-001-source.svg');
  assert.equal(out[0].cleanImage, '../../assets/sample/nw-001-clean.svg');
});

test('buildDemoProducts builds a 3-scene storyboard from product copy', () => {
  const out = buildDemoProducts(products);
  assert.equal(out[0].storyboard.length, 3);
  assert.equal(out[0].storyboard[2].cta, 'Shop Certified Refurbished');
});
