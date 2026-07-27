import { SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";

/**
 * Strip /ja (etc.) prefix from Next.js asPath for locale switching.
 */
export function stripLocalePrefix(asPath, locales = []) {
  const [pathAndQuery, hash = ""] = asPath.split("#");
  const [path, query = ""] = pathAndQuery.split("?");

  let stripped = path;
  for (const loc of locales) {
    if (stripped.startsWith(`/${loc}/`)) {
      stripped = stripped.slice(`/${loc}`.length) || "/";
      break;
    }
    if (stripped === `/${loc}`) {
      stripped = "/";
      break;
    }
  }

  const queryPart = query ? `?${query}` : "";
  const hashPart = hash ? `#${hash}` : "";
  return `${stripped}${queryPart}${hashPart}`;
}

/**
 * Build a locale-aware share URL for emaki pages (optional scene hash).
 */
export function buildShareUrl({
  locale,
  asPath,
  locales,
  defaultLocale = "en",
  navIndex = 0,
}) {
  const pathWithoutLocale = stripLocalePrefix(asPath, locales).split("#")[0];
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const hash = navIndex > 0 ? `#${navIndex}` : "";
  return `${SITE_ORIGIN}${prefix}${pathWithoutLocale}${hash}`;
}

export function buildTwitterShareUrl(url, text) {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildLineShareUrl(url) {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
}
