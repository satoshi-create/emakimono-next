/**
 * Build FAQPage JSON-LD string for guide SEO.
 * @param {{ q: string, a: string }[]} items
 */
export function buildFaqJsonLd(items) {
  if (!items?.length) return null;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  });
}
