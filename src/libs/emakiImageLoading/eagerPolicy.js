import { PLAYBACK_IMAGE_LOOKAHEAD } from "@/libs/constants/viewerPlayback";

const isPlayLookahead = (
  uniqueIndex,
  prefetchIndex,
  isPlayMode,
  lookahead
) => isPlayMode && uniqueIndex <= prefetchIndex + lookahead;

const isFullscreenNear = (uniqueIndex, prefetchIndex) =>
  Math.abs(uniqueIndex - prefetchIndex) <= 2;

/**
 * next/image loading 属性・onLoadingComplete 計測用の eager 判定。
 */
export const isEagerForNextImageLoading = ({
  uniqueIndex,
  prefetchIndex,
  isPlayMode,
  toggleFullscreen,
  lookahead = PLAYBACK_IMAGE_LOOKAHEAD,
}) =>
  uniqueIndex < 3 ||
  isPlayLookahead(uniqueIndex, prefetchIndex, isPlayMode, lookahead) ||
  (toggleFullscreen && isFullscreenNear(uniqueIndex, prefetchIndex));

/**
 * 全画面時フォールバック用 eager 判定（priority 初枚・universal とは別ロジック）。
 */
export const isEagerInFullscreen = ({
  uniqueIndex,
  prefetchIndex,
  isPlayMode,
  lookahead = PLAYBACK_IMAGE_LOOKAHEAD,
}) =>
  isPlayLookahead(uniqueIndex, prefetchIndex, isPlayMode, lookahead) ||
  isFullscreenNear(uniqueIndex, prefetchIndex);

/**
 * 通常表示時 universal フォールバック用 eager 判定。
 */
export const isEagerForUniversalFallback = ({
  uniqueIndex,
  prefetchIndex,
  isPlayMode,
  lookahead = PLAYBACK_IMAGE_LOOKAHEAD,
}) =>
  uniqueIndex < 3 ||
  isPlayLookahead(uniqueIndex, prefetchIndex, isPlayMode, lookahead);
