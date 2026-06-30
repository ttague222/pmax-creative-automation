// Pure validation: takes products array + a Set of approved overlay phrases,
// returns { errors, warnings } (arrays of strings). No filesystem access here —
// asset-existence checks live in the CLI wrapper.
export const REQUIRED_FIELDS = ['id', 'title', 'category', 'productUrl', 'sourceImagePaths', 'trustBadges', 'conditionNotes', 'cta'];

export function validateProducts(products, approvedOverlays) {
  if (!Array.isArray(products)) return { errors: ['products must be an array'], warnings: [] };

  const errors = [];
  const warnings = [];

  if (products.length < 3 || products.length > 5) {
    warnings.push(`Demo target is 3-5 products; manifest has ${products.length}.`);
  }

  const seenIds = new Set();
  for (const p of products) {
    const label = p.id ?? p.title ?? '(unnamed product)';

    for (const field of REQUIRED_FIELDS) {
      const v = p[field];
      if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === '') {
        errors.push(`${label}: missing required field "${field}"`);
      }
    }

    if (p.id) {
      if (seenIds.has(p.id)) errors.push(`${label}: duplicate id`);
      seenIds.add(p.id);
    }

    for (const badge of p.trustBadges ?? []) {
      if (!approvedOverlays.has(badge)) {
        errors.push(`${label}: trust badge "${badge}" is not in config/overlay-copy.json — add it there or fix the manifest.`);
      }
    }
    if (p.cta && !approvedOverlays.has(p.cta)) {
      errors.push(`${label}: cta "${p.cta}" is not an approved overlay phrase.`);
    }
  }

  return { errors, warnings };
}
