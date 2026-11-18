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

/** @type {Record<string, Record<string, string>>} */
const MASTER_SCROLL_SPOT_OVERRIDES = {
  imperial_palace: {
    rakuchu_rakugai_funaki: "shishinden",
    rakuchu_rakugai_fukuoka: "imperial-palace-shishinden",
    rakuchu_rakugai_met: "shishinden",
  },
  gion_yasaka: {
    rakuchu_rakugai_funaki: "gionsha",
    rakuchu_rakugai_fukuoka: "gionsha",
    rakuchu_rakugai_met: "gionsha",
  },
  toyokuni_shrine: {
    rakuchu_rakugai_funaki: "toyokunisha",
    rakuchu_rakugai_fukuoka: "toyokunisha",
    rakuchu_rakugai_met: "hokoku-mausoleum",
  },
  kabuki_amusements: {
    rakuchu_rakugai_funaki: "shijokawara",
    rakuchu_rakugai_met: "okuni-kabuki",
  },
  rokujo_misujimachi: {
    rakuchu_rakugai_funaki: "rokujosanjyomachi",
  },
};

/**
 * @param {(typeof RAKUCHU_SPOT_MASTERS)[number]} master
 * @param {string} titleen
 * @returns {string}
 */
function pickMatchedSpotIdForScroll(master, titleen) {
  const override = MASTER_SCROLL_SPOT_OVERRIDES[master.masterId]?.[titleen];
  if (override) return override;
  const aliases = master.aliasSpotIds ?? [];
  if (aliases.length === 0) return master.masterId;
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