import {
  RAKUCHU_SPOT_MASTERS,
  getMasterByRawSpotId,
  KYOTO_RIVER_POLYLINES,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

export { KYOTO_RIVER_POLYLINES };

/** @type {Record<string, { labelJa: string, labelEn: string }>} */
const RAKUCHU_SCROLL_LABELS = {
  rakuchu_rakugai_funaki: { labelJa: "舟木本", labelEn: "Funaki" },
  rakuchu_rakugai_fukuoka: { labelJa: "福岡本", labelEn: "Fukuoka" },
  rakuchu_rakugai_met: { labelJa: "メトロポリタン本", labelEn: "Met" },
};

/**
 * @param {(typeof RAKUCHU_SPOT_MASTERS)[number]} m
 * @returns {object | null}
 */
function masterToGeoSpot(m) {
  if (typeof m.lat !== "number" || typeof m.lng !== "number") return null;
  const presentIn = m.presentIn ?? [];
  const scrollLinks = presentIn.map((scrollSlug) => {
    const { labelJa, labelEn } = RAKUCHU_SCROLL_LABELS[scrollSlug] ?? {
      labelJa: scrollSlug,
      labelEn: scrollSlug,
    };
    const resolvedSpotId = pickMatchedSpotIdForScroll(m, scrollSlug);
    return {
      titleen: scrollSlug,
      labelJa,
      labelEn,
      spotId: resolvedSpotId,
      href: resolvedSpotId
        ? `/${scrollSlug}?spot=${encodeURIComponent(resolvedSpotId)}`
        : `/${scrollSlug}`,
    };
  });
  return {
    id: m.masterId,
    masterId: m.masterId,
    nameJa: m.nameJa,
    nameEn: m.nameEn,
    areaJa: m.areaJa ?? "",
    areaEn: m.areaEn ?? "",
    category: m.geoCategory ?? "landmark",
    wing: m.wing,
    lat: m.lat,
    lng: m.lng,
    descJa: m.summaryJa ?? "",
    descEn: m.summaryEn ?? "",
    presentIn,
    appearanceCount: presentIn.length,
    aliasSpotIds: m.aliasSpotIds ?? [],
    scrollLinks,
  };
}

/**
 * @param {(typeof RAKUCHU_SPOT_MASTERS)[number]} master
 * @param {string} titleen
 * @returns {string}
 */
function pickMatchedSpotIdForScroll(master, titleen) {
  const aliases = master.aliasSpotIds ?? [];
  if (aliases.length === 0) return master.masterId;
  if (aliases.length === 1) return aliases[0];
  const present = master.presentIn ?? [];
  const idx = present.indexOf(titleen);
  if (idx >= 0 && idx < aliases.length) return aliases[idx];
  return aliases[0];
}

const GEO_SPOTS_WITH_COORDS = RAKUCHU_SPOT_MASTERS.map(masterToGeoSpot).filter(
  Boolean
);

/**
 * @param {string} titleen
 * @param {string} spotId
 * @returns {ReturnType<typeof masterToGeoSpot> & { matchedSpotId: string } | null}
 */
export function findGeoSpotByScrollSpot(titleen, spotId) {
  if (!titleen || !spotId) return null;
  const master = getMasterByRawSpotId(spotId);
  if (!master) return null;
  const geo = masterToGeoSpot(master);
  if (!geo) return null;
  if (!(master.presentIn ?? []).includes(titleen)) return null;
  return { ...geo, matchedSpotId: spotId };
}

/**
 * @param {string} titleen
 * @returns {Array<ReturnType<typeof masterToGeoSpot> & { matchedSpotId: string }>}
 */
export function getGeoSpotsForScroll(titleen) {
  if (!titleen) return [];
  return RAKUCHU_SPOT_MASTERS.filter((m) =>
    (m.presentIn ?? []).includes(titleen)
  )
    .map((m) => {
      const geo = masterToGeoSpot(m);
      if (!geo) return null;
      return {
        ...geo,
        matchedSpotId: pickMatchedSpotIdForScroll(m, titleen),
      };
    })
    .filter(Boolean);
}

/**
 * @returns {Array<NonNullable<ReturnType<typeof masterToGeoSpot>>>}
 */
export function getAllRakuchuGeoNodes() {
  return GEO_SPOTS_WITH_COORDS;
}