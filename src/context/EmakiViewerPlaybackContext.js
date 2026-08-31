import { createContext, useContext } from "react";

const defaultPlaybackContext = {
  isPlayModeRef: { current: false },
  prefetchSceneIndexRef: { current: 0 },
};

/**
 * 再生モード ref（安定参照）。LazyImage の memo を崩さず再生状態・先読み index を読む。
 * EmakiConteiner が毎 render で isPlayModeRef / prefetchSceneIndexRef を同期する。
 */
export const EmakiViewerPlaybackContext = createContext(defaultPlaybackContext);

export const useEmakiViewerPlayback = () => useContext(EmakiViewerPlaybackContext);

export const useIsPlayModeRef = () =>
  useContext(EmakiViewerPlaybackContext).isPlayModeRef;

export const usePrefetchSceneIndexRef = () =>
  useContext(EmakiViewerPlaybackContext).prefetchSceneIndexRef;
