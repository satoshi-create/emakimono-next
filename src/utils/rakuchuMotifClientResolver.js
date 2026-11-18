import funakiScroll from "@/data/scroll-metadata/scrolls/rakuchu_rakugai_funaki.json";
import fukuokaScroll from "@/data/scroll-metadata/scrolls/rakuchu_rakugai_fukuoka.json";
import metScroll from "@/data/scroll-metadata/scrolls/rakuchu_rakugai_met.json";
import { RAKUCHU_SPOT_MASTERS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

export const BYOBU_SPOT_LIKE_INDEX_OFFSET = 1000;

/** @type {{ titleen: string, emakis: unknown[] }[]} */
const RAKUCHU_EDITION_SCROLLS = [
  { titleen: "rakuchu_rakugai_funaki", emakis: funakiScroll.emakis },
  { titleen: "rakuchu_rakugai_fukuoka", emakis: fukuokaScroll.emakis },
  { titleen: "rakuchu_rakugai_met", emakis: metScroll.emakis },
];

/** @type {Record<string, { preferredSpotId?: string }>} */
const MOTIF_VISUAL_OVERRIDES = {
  "hokoji_daibutsu:rakuchu_rakugai_met": { preferredSpotId: "daibutsuden" },
  "nijo_castle:rakuchu_rakugai_met": { preferredSpotId: "nijocastle" },
  "imperial_palace:rakuchu_rakugai_funaki": { preferredSpotId: "shishinden" },
  "imperial_palace:rakuchu_rakugai_fukuoka": {
    preferredSpotId: "imperial-palace-shishinden",
  },
};

/** @param {string | null | undefined} image */
function toMotifImageUrl(image) {
  if (!image || typeof image !== "string") return image ?? null;
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return buildCloudinaryUrl(image);
}

/**
 * @param {unknown[] | undefined} emakis
 * @returns {Record<string, { spotId: string, spotLikeIndex: number, sliceIndex: number, image: string | null, x?: number, y?: number, rect?: unknown }>}
 */
function buildSpotLikeIndexMap(emakis) {
  /** @type {Record<string, { spotId: string, spotLikeIndex: number, sliceIndex: number, image: string | null, x?: number, y?: number, rect?: unknown }>} */
  const map = {};
  if (!Array.isArray(emakis)) return map;

  let globalSpotIndex = 0;
  let sliceIndex = -1;

  for (const slice of emakis) {
    if (slice?.cat !== "image" || !Array.isArray(slice.spots)) continue;
    sliceIndex += 1;
    const image = slice.image ?? slice.src ?? null;
    for (const spot of slice.spots) {
      if (!spot?.id) continue;
      const spotId = String(spot.id);
      map[spotId] = {
        spotId,
        spotLikeIndex: BYOBU_SPOT_LIKE_INDEX_OFFSET + globalSpotIndex,
        sliceIndex,
        image: image ? String(image) : null,
        x: spot.x,
        y: spot.y,
        rect: spot.rect ?? null,
      };
      globalSpotIndex += 1;
    }
  }

  return map;
}

/** @type {Record<string, Record<string, { spotId: string, spotLikeIndex: number, sliceIndex: number, image: string | null, x?: number, y?: number, rect?: unknown }>>} */
const SPOT_INDEX_BY_TITLEEN = Object.fromEntries(
  RAKUCHU_EDITION_SCROLLS.map(({ titleen, emakis }) => [
    titleen,
    buildSpotLikeIndexMap(emakis),
  ])
);

/**
 * @param {string | null | undefined} masterIdOrSpotId
 * @returns {import("@/data/rakuchu-rakugai/rakuchuMotifMaster").RAKUCHU_SPOT_MASTERS[number] | null}
 */
function findSpotMaster(masterIdOrSpotId) {
  if (!masterIdOrSpotId) return null;
  const id = String(masterIdOrSpotId);
  return (
    RAKUCHU_SPOT_MASTERS.find(
      (master) =>
        master.masterId === id ||
        (Array.isArray(master.aliasSpotIds) && master.aliasSpotIds.includes(id))
    ) ?? null
  );
}

/**
 * @param {string} titleen
 * @param {{ masterId: string, aliasSpotIds?: string[] }} master
 */
function resolveSpotEntryForEdition(titleen, master) {
  const indexMap = SPOT_INDEX_BY_TITLEEN[titleen];
  if (!indexMap) return null;

  const override = MOTIF_VISUAL_OVERRIDES[`${master.masterId}:${titleen}`];
  const preferredId = override?.preferredSpotId;
  const aliasIds = Array.isArray(master.aliasSpotIds) ? master.aliasSpotIds : [];
  const candidateIds = preferredId
    ? [preferredId, ...aliasIds.filter((aid) => aid !== preferredId)]
    : aliasIds;

  for (const spotId of candidateIds) {
    const entry = indexMap[String(spotId)];
    if (entry) return entry;
  }
  return null;
}

/**
 * @param {string | null | undefined} masterId
 * @returns {Record<string, { titleen: string, spotId: string, spotLikeIndex: number, visual: object, href: string } | null>}
 */
export function resolveMotifEditionDetails(masterId) {
  const master = findSpotMaster(masterId);
  if (!master) return {};

  /** @type {Record<string, { titleen: string, spotId: string, spotLikeIndex: number, visual: object, href: string } | null>} */
  const byEdition = {};

  for (const { titleen } of RAKUCHU_EDITION_SCROLLS) {
    const present =
      !Array.isArray(master.presentIn) || master.presentIn.includes(titleen);
    if (!present) {
      byEdition[titleen] = null;
      continue;
    }

    const spotEntry = resolveSpotEntryForEdition(titleen, master);
    if (!spotEntry) {
      byEdition[titleen] = null;
      continue;
    }

    byEdition[titleen] = {
      titleen,
      spotId: spotEntry.spotId,
      spotLikeIndex: spotEntry.spotLikeIndex,
      visual: {
        image: toMotifImageUrl(spotEntry.image),
        x: spotEntry.x,
        y: spotEntry.y,
        rect: spotEntry.rect ?? null,
        spotId: spotEntry.spotId,
        sliceIndex: spotEntry.sliceIndex,
      },
      href: `/${titleen}?spot=${encodeURIComponent(spotEntry.spotId)}`,
    };
  }

  return byEdition;
}