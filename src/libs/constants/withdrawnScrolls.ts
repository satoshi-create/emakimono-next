import withdrawnTitleen from "./withdrawnTitleen.json";

/** URL slugs (titleen) withdrawn from public index — see src/data/withdrawn/ */
const WITHDRAWN_TITLEEN = withdrawnTitleen;

function isWithdrawnScroll(titleen) {
  return WITHDRAWN_TITLEEN.includes(titleen);
}

/** Paths for next-sitemap exclude (en + ja). */
function withdrawnSitemapExcludes() {
  return WITHDRAWN_TITLEEN.flatMap((slug) => [`/${slug}`, `/ja/${slug}`]);
}

export { WITHDRAWN_TITLEEN, isWithdrawnScroll, withdrawnSitemapExcludes };
