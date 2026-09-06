/**
 * 描画窓 Phase 1: レイアウト幅を保ったまま、遠いシーンの中身だけ間引く。
 */
import {
  CONTENT_WINDOW_ENTER_RADIUS,
  CONTENT_WINDOW_EXIT_RADIUS,
  CONTENT_WINDOW_PLAY_ENTER_RADIUS,
} from "@/libs/constants/viewerPlayback";

/**
 * @param {number} index 配列 index（section[id] / linkId）
 * @param {number} centerIndex 読取中心（navIndex または liveSceneIndex）
 * @param {boolean} wasMounted 直前フレームで中身を載せていたか
 * @param {{ isPlayMode?: boolean }} [opts]
 */
export function shouldMountSceneContent(
  index,
  centerIndex,
  wasMounted,
  opts = {}
) {
  const center = Number.isFinite(centerIndex) ? centerIndex : 0;
  const enter = opts.isPlayMode
    ? CONTENT_WINDOW_PLAY_ENTER_RADIUS
    : CONTENT_WINDOW_ENTER_RADIUS;
  const exit = Math.max(enter + 2, CONTENT_WINDOW_EXIT_RADIUS);
  const dist = Math.abs(index - center);
  if (dist <= enter) return true;
  if (wasMounted && dist <= exit) return true;
  return false;
}

/**
 * LazyImage と同じ幅式（scrollWidth を変えない殻用）。
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
    return {
      width: "20vh",
      height: "100%",
      flexShrink: 0,
      backgroundColor: "#f5f0e6",
    };
  }
  const { toggleFullscreen, orientation } = ctx;
  let heightVar = "var(--vh-75)";
  if (toggleFullscreen) heightVar = "var(--vh-100)";
  else if (orientation === "portrait") heightVar = "var(--vh-45)";
  else if (orientation === "landscape") heightVar = "var(--vh-75)";

  return {
    width: `calc(${srcWidth / srcHeight} * ${heightVar})`,
    height: "100%",
    flexShrink: 0,
    aspectRatio: `${srcWidth} / ${srcHeight}`,
    backgroundColor: "#f5f0e6",
  };
}
