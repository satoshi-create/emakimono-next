import emakisMetadata from "@/data/scroll-metadata";
import { RAKUCHU_SPOT_MASTERS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { RAKUCHU_RAKUGAI_CLUSTER_TITLEEN } from "@/libs/constants/discoveryLinks";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { removeNestedEmakisObj } from "@/utils/func";

/** @param {string | null | undefined} image */
function toMotifImageUrl(image) {
  if (!image || typeof image !== "string") return image;
  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("/")
  ) {
    return image;
  }
  return buildCloudinaryUrl(image);
}

/** @type {Record<string, { preferredSpotId?: string, dx?: number, dy?: number, zoom?: number }>} */
const MOTIF_VISUAL_OVERRIDES = {
  "hokoji_daibutsu:rakuchu_rakugai_met": { preferredSpotId: "daibutsuden" },
  "nijo_castle:rakuchu_rakugai_met": { preferredSpotId: "nijocastle" },
  "imperial_palace:rakuchu_rakugai_funaki": { preferredSpotId: "shishinden" },
  "imperial_palace:rakuchu_rakugai_fukuoka": {
    preferredSpotId: "imperial-palace-shishinden",
    dy: -6,
  },
  "kiyomizudera:rakuchu_rakugai_fukuoka": { dy: -6 },
  "kamogawa:rakuchu_rakugai_funaki": { dy: -5 },
};

/**
 * @param {{ cat?: string, src?: string, image?: string, spots?: { id?: string, name?: string, nameen?: string, x?: number, y?: number }[] }[]} emakis
 * @param {string[]} aliasSpotIds
 * @param {string | undefined} preferredSpotId
 * @returns {{ image: string, x: number, y: number, spotNameJa: string, spotNameEn: string, sliceIndex: number } | null}
 */
function resolveMotifVisualForScroll(emakis, aliasSpotIds, preferredSpotId) {
  if (!Array.isArray(emakis) || !aliasSpotIds?.length) return null;
  const aliasSet = new Set(aliasSpotIds);

  if (preferredSpotId) {
    let sliceIndex = -1;
    for (const slice of emakis) {
      if (slice?.cat !== "image") continue;
      sliceIndex += 1;
      const spots = slice.spots;
      if (!Array.isArray(spots)) continue;
      const spot = spots.find((s) => s?.id === preferredSpotId);
      if (!spot) continue;
      const image = slice.image ?? slice.src ?? null;
      if (!image) return null;
      return {
        image,
        x: spot.x,
        y: spot.y,
        rect: spot.rect ?? null,
        spotNameJa: spot.name ?? "",
        spotNameEn: spot.nameen ?? spot.nameEn ?? "",
        sliceIndex,
        spotId: spot.id,
      };
    }
  }

  let sliceIndex = -1;
  for (const slice of emakis) {
    if (slice?.cat !== "image") continue;
    sliceIndex += 1;
    const spots = slice.spots;
    if (!Array.isArray(spots)) continue;
    const spot = spots.find((s) => s?.id && aliasSet.has(s.id));
    if (!spot) continue;
    const image = slice.image ?? slice.src ?? null;
    if (!image) return null;
    return {
      image,
      x: spot.x,
      y: spot.y,
      rect: spot.rect ?? null,
      spotNameJa: spot.name ?? "",
      spotNameEn: spot.nameen ?? spot.nameEn ?? "",
      sliceIndex,
      spotId: spot.id,
    };
  }
  return null;
}

/**
 * @param {unknown[] | undefined} emakis
 * @param {number} imageSliceIndex
 */
function sceneForImageSlice(emakis, imageSliceIndex) {
  if (!Array.isArray(emakis) || imageSliceIndex < 0) return undefined;
  let idx = -1;
  let currentScene = 1;
  let ekotobaOrdinal = 0;
  for (const slice of emakis) {
    if (slice?.cat === "ekotoba") {
      ekotobaOrdinal += 1;
      const ch = Number(slice.chapter);
      currentScene =
        Number.isFinite(ch) && ch >= 1 ? ch : ekotobaOrdinal;
    } else if (slice?.cat === "image") {
      idx += 1;
      if (idx === imageSliceIndex) return currentScene;
    }
  }
  return undefined;
}

/** @param {Map<string, { emakis?: unknown[] }>} rawByTitleen */
function buildStripsByTitleen(rawByTitleen) {
  /** @type {Record<string, { image: string, srcWidth: number, srcHeight: number, spots: unknown[], linkId: number, scene: number, name?: string }[]>} */
  const stripsByTitleen = {};
  for (const titleen of RAKUCHU_RAKUGAI_CLUSTER_TITLEEN) {
    const raw = rawByTitleen.get(titleen);
    const emakis = raw?.emakis;
    if (!Array.isArray(emakis)) {
      stripsByTitleen[titleen] = [];
      continue;
    }
    let currentScene = 1;
    let ekotobaOrdinal = 0;
    const strips = [];
    let linkId = 0;
    for (const slice of emakis) {
      if (slice?.cat === "ekotoba") {
        ekotobaOrdinal += 1;
        const ch = Number(slice.chapter);
        currentScene =
          Number.isFinite(ch) && ch >= 1 ? ch : ekotobaOrdinal;
      } else if (slice?.cat === "image") {
        const srcWidth = slice.srcWidth ?? 0;
        if (srcWidth > 0) {
          const image = slice.image ?? slice.src;
          if (image) {
            strips.push({
              image: toMotifImageUrl(image),
              srcWidth,
              srcHeight: slice.srcHeight ?? 0,
              spots: Array.isArray(slice.spots) ? slice.spots : [],
              linkId,
              scene: currentScene,
              name: slice.name ?? "",
            });
          }
        }
      }
      linkId += 1;
    }
    stripsByTitleen[titleen] = strips;
  }
  return stripsByTitleen;
}

/** @param {Map<string, { emakis?: unknown[] }>} rawByTitleen */
function buildMotifVisuals(rawByTitleen) {
  /** @type {Record<string, Record<string, { image: string, x: number, y: number, dx: number, dy: number, zoom: number } | null>>} */
  const motifVisuals = {};
  for (const master of RAKUCHU_SPOT_MASTERS) {
    const perScroll = {};
    for (const titleen of RAKUCHU_RAKUGAI_CLUSTER_TITLEEN) {
      const raw = rawByTitleen.get(titleen);
      const override = MOTIF_VISUAL_OVERRIDES[`${master.masterId}:${titleen}`];
      const resolved = resolveMotifVisualForScroll(
        raw?.emakis,
        master.aliasSpotIds,
        override?.preferredSpotId
      );
      perScroll[titleen] = resolved
        ? {
            image: toMotifImageUrl(resolved.image),
            x: resolved.x,
            y: resolved.y,
            rect: resolved.rect ?? null,
            spotId: resolved.spotId,
            sliceIndex: resolved.sliceIndex,
            scene: sceneForImageSlice(raw?.emakis, resolved.sliceIndex),
            dx: override?.dx ?? 0,
            dy: override?.dy ?? 0,
            ...(typeof override?.zoom === "number" ? { zoom: override.zoom } : {}),
          }
        : null;
    }
    motifVisuals[master.masterId] = perScroll;
  }
  return motifVisuals;
}

const TITLEEN_SET = new Set(RAKUCHU_RAKUGAI_CLUSTER_TITLEEN);

/** Scroll belongs to the rakuchu / rakugai discovery cluster. */
export function isRakuchuRakugaiClusterScroll(emaki) {
  return TITLEEN_SET.has(emaki?.titleen);
}

/**
 * Hub data for /rakuchu-rakugai/chapters.
 * Order follows RAKUCHU_RAKUGAI_CLUSTER_TITLEEN (stable curation).
 */
export function buildRakuchuRakugaiHubData() {
  const clusterEmakis = emakisMetadata.filter(
    (emaki) =>
      isRakuchuRakugaiClusterScroll(emaki) &&
      !isWithdrawnScroll(emaki.titleen)
  );
  const rawByTitleen = new Map(
    clusterEmakis.map((emaki) => [emaki.titleen, emaki])
  );
  const byTitleen = new Map(
    clusterEmakis.map((emaki) => [
      emaki.titleen,
      removeNestedEmakisObj(emaki),
    ])
  );
  const motifVisuals = buildMotifVisuals(rawByTitleen);
  const stripsByTitleen = buildStripsByTitleen(rawByTitleen);

  const scrolls = RAKUCHU_RAKUGAI_CLUSTER_TITLEEN.map((titleen) =>
    byTitleen.get(titleen)
  )
    .filter(Boolean)
    .map((emaki) => ({
      titleen: emaki.titleen,
      title: emaki.title,
      thumb: emaki.thumb ?? null,
      era: emaki.era ?? null,
      eraen: emaki.eraen ?? null,
      author: emaki.author ?? null,
      authoren: emaki.authoren ?? null,
      desc: emaki.desc ?? null,
      descen: emaki.descen ?? null,
      edition: emaki.edition ?? null,
    }));

  const hero =
    scrolls.find((s) => s.titleen === "rakuchu_rakugai_funaki") ??
    scrolls[0] ??
    null;

  return {
    scrolls,
    heroThumb: hero?.thumb ?? null,
    motifVisuals,
    stripsByTitleen,
  };
}