import { PLAYBACK_SUPPRESS_IMAGE_VISUAL_UPDATE } from "@/libs/constants/viewerPlayback";
import { SKELETON_FADE_OUT_MS } from "./constants";

export const shouldSuppressPlaybackImageVisual = (isPlayModeRef) =>
  PLAYBACK_SUPPRESS_IMAGE_VISUAL_UPDATE && isPlayModeRef?.current;

/**
 * 画像ロード完了・fallback 時のスケルトン / フェード更新。
 * 再生中は React state を触らず CSS（data-playback-active）のみ。停止時に playbackSyncTick で同期。
 */
export const applyImageLoadVisualComplete = ({
  isPlayModeRef,
  isSkeletonVisible,
  setImageLoaded,
  setSkeletonVisible,
}) => {
  if (!isSkeletonVisible) return;

  if (shouldSuppressPlaybackImageVisual(isPlayModeRef)) {
    return;
  }

  setImageLoaded(true);
  setTimeout(() => setSkeletonVisible(false), SKELETON_FADE_OUT_MS);
};
