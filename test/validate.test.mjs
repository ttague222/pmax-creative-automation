import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProducts } from '../src/lib/validate.mjs';

const approved = new Set(['Certified Refurbished', 'Warranty Included', 'Shop Certified Refurbished']);

const goodProduct = {
  id: 'nw-001', title: 'Sample', category: 'home',
  productUrl: 'https://example-store.test/products/x',
  sourceImagePaths: ['assets/sample/nw-001-source.svg'],
  trustBadges: ['Certified Refurbished'], conditionNotes: 'note',
  cta: 'Shop Certified Refurbished',
};

test('valid product produces no errors', () => {
  const { errors } = validateProducts([goodProduct], approved);
  assert.deepEqual(errors, []);
});

test('missing required field is an error', () => {
  const bad = { ...goodProduct, title: '' };
  const { errors } = validateProducts([bad], approved);
  assert.ok(errors.some((e) => e.includes('title')));
});

test('duplicate id is an error', () => {
  const { errors } = validateProducts([goodProduct, goodProduct], approved);
  assert.ok(errors.some((e) => e.includes('duplicate id')));
});

test('unapproved trust badge is an error', () => {
  const bad = { ...goodProduct, trustBadges: ['Like New'] };
  const { errors } = validateProducts([bad], approved);
  assert.ok(errors.some((e) => e.includes('not in')));
});

test('cta not in approved overlays is an error', () => {
  const bad = { ...goodProduct, cta: 'Buy Now Cheap' };
  const { errors } = validateProducts([bad], approved);
  assert.ok(errors.some((e) => e.includes('cta')));
});

test('non-array input is an error, not a crash', () => {
  const { errors } = validateProducts(null, approved);
  assert.ok(errors.some((e) => e.includes('products must be an array')));
});
