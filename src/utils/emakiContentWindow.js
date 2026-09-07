/**
 * 描画窓 Phase 1: レイアウト幅を保ったまま、遠いシーンの中身だけ間引く。
 */
import {
  CONTENT_WINDOW_ENTER_RADIUS,
  CONTENT_WINDOW_PLAY_ENTER_RADIUS,
  SCENE_READING_POSITION_RATIO,
} from "@/libs/constants/viewerPlayback";

/**
 * @param {number} index 配列 index（section[id] / linkId）
 * @param {number} centerIndex 読取中心（scrollLeft 追従の contentWindowCenter 等）
 * @param {boolean} wasMounted 直前フレームで中身を載せていたか
 * @param {{ isPlayMode?: boolean }} [opts]
 */
export function shouldMountSceneContent(
  index,
  centerIndex,
  wasMounted,
  opts = {}
) {
  // sticky: 一度載せた中身は外さない（remount による blur 再発・幅揺れを防ぐ）
  if (wasMounted) return true;
  const center = Number.isFinite(centerIndex) ? centerIndex : 0;
  const enter = opts.isPlayMode
    ? CONTENT_WINDOW_PLAY_ENTER_RADIUS
    : CONTENT_WINDOW_ENTER_RADIUS;
  return Math.abs(index - center) <= enter;
}

/**
 * シーン1枚の表示幅（px）。article 行高さを基準に LazyImage / 殻と同じ ratio 式。
 * @param {{ cat?: string, src?: string, srcWidth?: number, srcHeight?: number }} item
 * @param {number} rowHeightPx
 */
export function sceneWidthPx(item, rowHeightPx) {
  const h = rowHeightPx > 0 ? rowHeightPx : 1;
  const { cat, src, srcWidth, srcHeight } = item || {};
  if (cat === "ekotoba" && !src) return 0;
  if (!srcWidth || !srcHeight) return h * 0.2; // 殻フォールバック 20vh 相当
  return (srcWidth / srcHeight) * h;
}

/**
 * DOM キャッシュ前でも描画窓を進められるよう、メタデータ幅から読取中心シーンを推定。
 * RTL（row-reverse）: |scrollLeft| が進むほど巻の「先」へ。
 * @param {Array<{ cat?: string, src?: string, srcWidth?: number, srcHeight?: number }>} emakis
 * @param {number} scrollLeft
 * @param {number} clientWidth
 * @param {number} rowHeightPx
 * @param {number} [readingRatio]
 */
export function estimateSceneIndexFromScrollLeft(
  emakis,
  scrollLeft,
  clientWidth,
  rowHeightPx,
  readingRatio = SCENE_READING_POSITION_RATIO
) {
  if (!emakis?.length || !(rowHeightPx > 0) || !(clientWidth > 0)) return 0;
  const readingFromStart =
    Math.abs(scrollLeft) + clientWidth * readingRatio;
  let acc = 0;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < emakis.length; i += 1) {
    const w = sceneWidthPx(emakis[i], rowHeightPx);
    const center = acc + w * 0.5;
    const dist = Math.abs(center - readingFromStart);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
    acc += w;
  }
  return best;
}

/**
 * section に常置する幅スタイル（殻／中身差し替えで flex 幅を変えない）。
 * @param {{ cat?: string, src?: string, srcWidth?: number, srcHeight?: number }} item
 * @param {{ toggleFullscreen?: boolean, orientation?: string }} ctx
 */
export function buildSceneShellStyle(item, ctx = {}) {
  const { cat, src, srcWidth, srcHeight } = item || {};
  if (cat === "ekotoba" && !src) {
    return {
      width: 0,
      minWidth: 0,
      height: "100%",
      flexShrink: 0,
      overflow: "visible",
    };
  }
  if (!srcWidth || !srcHeight) {
    const fallbackW = "20vh";
    return {
      width: fallbackW,
      minWidth: fallbackW,
      maxWidth: fallbackW,
      height: "100%",
      flexShrink: 0,
      overflow: "hidden",
      backgroundColor: "#f5f0e6",
    };
  }
  const { toggleFullscreen, orientation } = ctx;
  let heightVar = "var(--vh-75)";
  if (toggleFullscreen) heightVar = "var(--vh-100)";
  else if (orientation === "portrait") heightVar = "var(--vh-45)";
  else if (orientation === "landscape") heightVar = "var(--vh-75)";

  const width = `calc(${srcWidth / srcHeight} * ${heightVar})`;
  return {
    width,
    // flex の min-width:auto が next/image 固有サイズで section を押し広げるのを防ぐ
    minWidth: width,
    maxWidth: width,
    height: "100%",
    flexShrink: 0,
    overflow: "hidden",
    aspectRatio: `${srcWidth} / ${srcHeight}`,
    backgroundColor: "#f5f0e6",
  };
}
