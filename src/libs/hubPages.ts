import hubPagesData from "@/data/hubPages";

export function getAllHubPages() {
  const list = Array.isArray(hubPagesData) ? hubPagesData : [];
  return [...list].sort((a, b) => (a.navOrder ?? 999) - (b.navOrder ?? 999));
}

export function getDynamicHubPages() {
  return getAllHubPages().filter((hub) => !hub.isBuiltin);
}

export function getHubBySlug(slug) {
  if (!slug) return null;
  return getAllHubPages().find((hub) => hub.slug === slug) || null;
}

export function getHubByPath(path) {
  if (!path) return null;
  return getAllHubPages().find((hub) => hub.path === path) || null;
}

export function getHubHref(hubOrSlug) {
  if (!hubOrSlug) return "/hub";
  if (typeof hubOrSlug === "string") {
    const found = getHubBySlug(hubOrSlug) || getHubByPath(hubOrSlug);
    if (found?.path) return found.path;
    return hubOrSlug.startsWith("/") ? hubOrSlug : `/hub/${encodeURIComponent(hubOrSlug)}`;
  }
  if (typeof hubOrSlug.path === "string" && hubOrSlug.path.startsWith("/")) {
    return hubOrSlug.path;
  }
  if (hubOrSlug.slug) {
    const found = getHubBySlug(hubOrSlug.slug);
    if (found?.path) return found.path;
    return `/hub/${encodeURIComponent(hubOrSlug.slug)}`;
  }
  return "/hub";
}

export function filterEmakisForHub(allEmakis = [], hub) {
  if (!hub || !Array.isArray(allEmakis)) return [];
  const scrollIdSet = new Set(Array.isArray(hub.scrollIds) ? hub.scrollIds : []);
  const typeSet = new Set(Array.isArray(hub.typeen) ? hub.typeen : []);
  const keywords = Array.isArray(hub.keywords)
    ? hub.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    : [];

  return allEmakis.filter((emaki) => {
    if (!emaki) return false;
    if (scrollIdSet.size > 0 && scrollIdSet.has(emaki.slug || emaki.id)) {
      return true;
    }
    if (typeSet.size > 0 && typeSet.has(emaki.typeen)) {
      return true;
    }
    if (keywords.length > 0) {
      const haystack = [
        emaki.title,
        emaki.titleen,
        emaki.era,
        emaki.author,
        emaki.description,
        ...(Array.isArray(emaki.keywords) ? emaki.keywords : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return keywords.some((kw) => haystack.includes(kw));
    }
    return false;
  });
}

export function getHubSlugsForEmaki(emaki) {
  if (!emaki) return [];
  const slugs = new Set();
  for (const hub of getAllHubPages()) {
    if (!hub?.slug) continue;
    if (filterEmakisForHub([emaki], hub).length > 0) {
      slugs.add(hub.slug);
    }
  }
  return [...slugs];
}
