import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { SCENE_READING_POSITION_RATIO } from "@/libs/constants/viewerPlayback";

function imageUrlForItem(item) {
  if (!item || item.cat !== "image") return null;
  const publicId = typeof item.src === "string" ? item.src : item.src?.src;
  if (!publicId) return null;
  const w = item.srcWidth || item.width || 1200;
  return buildCloudinaryUrl(publicId, [`w_${w}`, "f_auto", "q_auto:eco"]);
}

/**
 * article 内 section の実測幅からトラックレイアウトを構築。
 */
export function buildTrackFromArticle(articleEl, processedEmakis) {
  const sections = Array.from(articleEl.querySelectorAll(":scope > section"));
  let startPx = 0;
  const segments = [];

  sections.forEach((section) => {
    const sceneIndex = parseInt(section.id, 10);
    if (Number.isNaN(sceneIndex)) return;

    const widthPx = section.offsetWidth;
    if (widthPx <= 0) return;

    const item = processedEmakis[sceneIndex];
    segments.push({
      arrayIndex: segments.length,
      sceneIndex,
      cat: item?.cat || "unknown",
      widthPx,
      startPx,
      imageUrl: imageUrlForItem(item),
      uniqueIndex: item?.uniqueIndex ?? null,
    });
    startPx += widthPx;
  });

  return segments;
}

export function scrollLeftToOffset(scrollLeft) {
  return Math.abs(scrollLeft);
}

export function offsetToScrollLeft(offsetPx, maxScrollPx) {
  const clamped = Math.min(Math.max(0, offsetPx), maxScrollPx);
  return -clamped;
}

export function findSegmentIndexAtOffset(segments, offsetPx) {
  if (!segments.length) return 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (offsetPx >= segments[i].startPx) return i;
  }
  return 0;
}

export function buildSlotWindow(segments, centerIndex) {
  const indices = [centerIndex - 1, centerIndex, centerIndex + 1];
  return indices.map((idx) => {
    const seg = segments[idx];
    if (!seg) {
      return {
        sceneIndex: -1,
        uniqueIndex: null,
        widthPx: 0,
        imageUrl: null,
        ready: true,
      };
    }
    return {
      sceneIndex: seg.sceneIndex,
      uniqueIndex: seg.uniqueIndex,
      widthPx: seg.widthPx,
      imageUrl: seg.imageUrl,
      ready: Boolean(seg.imageUrl || seg.cat !== "image"),
    };
  });
}

/** segment トラック終端と article scrollWidth の小さい方を maxScroll に使う */
export function computeMaxScrollPx(segments, articleEl) {
  const clientWidth = articleEl.clientWidth;
  const articleMax = Math.max(0, articleEl.scrollWidth - clientWidth);
  if (!segments.length) return articleMax;

  const last = segments[segments.length - 1];
  const trackEnd = last.startPx + last.widthPx;
  const trackMax = Math.max(0, trackEnd - clientWidth);
  return Math.min(articleMax, trackMax);
}

/**
 * 読取位置（右 38%）アンカー + window 補正。
 * offset 増加で translate も増加（順行方向維持）。
 */
export function computeStripTranslateX(segments, centerIndex, offsetPx, viewportWidthPx) {
  const readingAnchorPx = viewportWidthPx * (1 - SCENE_READING_POSITION_RATIO);
  const leftSeg = segments[centerIndex - 1];
  const windowStartPx = leftSeg ? leftSeg.startPx : segments[centerIndex]?.startPx ?? 0;
  return readingAnchorPx + offsetPx - windowStartPx;
}
