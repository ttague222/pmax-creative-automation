// Pure: builds a Creatomate starter payload object from a product + chosen
// image + creative rules. No filesystem, no network — easy to test.
export function buildPayload(product, format, imagePath, rules) {
  return {
    format,
    templateId: `REPLACE_WITH_CREATOMATE_${format.toUpperCase()}_TEMPLATE_ID`,
    modifications: {
      'product-title': product.title,
      'product-image': imagePath,
      'trust-overlay-1': product.trustBadges[0] ?? 'Certified Refurbished',
      'trust-overlay-2': product.trustBadges[1] ?? '',
      'price-text': product.priceText ?? '',
      'cta-text': product.cta,
    },
    meta: {
      productId: product.id,
      category: product.category,
      productUrl: product.productUrl,
      conditionNotes: product.conditionNotes,
      creativeRulesVersion: rules.version,
      videoConstraints: {
        maxDurationSeconds: rules.video.maxDurationSeconds,
        motionStyle: rules.video.motionStyle,
      },
    },
  };
}
