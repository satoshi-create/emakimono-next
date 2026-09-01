import {
  PLAYBACK_DOM_WINDOW_AHEAD_MARGIN,
  PLAYBACK_DOM_WINDOW_BEHIND,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";

/**
 * 再生中に実 DOM（LazyImage）を維持する uniqueIndex 範囲。
 * 範囲外はレイアウト幅のみのスペーサーに差し替え、合成レイヤー内の子を削減する。
 */
export const isInPlaybackDomWindow = (
  uniqueIndex,
  prefetchIndex,
  {
    behind = PLAYBACK_DOM_WINDOW_BEHIND,
    aheadMargin = PLAYBACK_DOM_WINDOW_AHEAD_MARGIN,
    lookahead = PLAYBACK_IMAGE_LOOKAHEAD,
  } = {}
) =>
  uniqueIndex >= prefetchIndex - behind &&
  uniqueIndex <= prefetchIndex + lookahead + aheadMargin;

/** LazyImage / PlaybackSceneSpacer と同じ幅計算 */
export const getPlaybackSceneWidthCss = (
  srcWidth,
  srcHeight,
  { toggleFullscreen = false, orientation = "landscape" } = {}
) => {
  let heightVar = "var(--vh-75)";
  if (toggleFullscreen) heightVar = "var(--vh-100)";
  else if (orientation === "portrait") heightVar = "var(--vh-45)";
  return `calc(${srcWidth / srcHeight} * ${heightVar})`;
};
