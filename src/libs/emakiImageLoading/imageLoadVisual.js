import { PLAYBACK_SUPPRESS_IMAGE_VISUAL_UPDATE } from "@/libs/constants/viewerPlayback";
import { SKELETON_FADE_OUT_MS } from "./constants";

export const shouldSuppressPlaybackImageVisual = (isPlayModeRef) =>
  PLAYBACK_SUPPRESS_IMAGE_VISUAL_UPDATE && isPlayModeRef?.current;

/**
 * 画像ロード完了・fallback 時のスケルトン / フェード更新。
 * 再生中は setImageLoaded(true) のみ（スケルトン opacity 0）。setSkeletonVisible / fade はスキップ。
 */
export const applyImageLoadVisualComplete = ({
  isPlayModeRef,
  isSkeletonVisible,
  setImageLoaded,
  setSkeletonVisible,
}) => {
  if (!isSkeletonVisible) return;

  if (shouldSuppressPlaybackImageVisual(isPlayModeRef)) {
    setImageLoaded(true);
    return;
  }

  setImageLoaded(true);
  setTimeout(() => setSkeletonVisible(false), SKELETON_FADE_OUT_MS);
};
