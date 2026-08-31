import { createContext, useContext } from "react";

/**
 * 再生モード ref（安定参照）。LazyImage の memo を崩さず eager / lazyBoundary を読む。
 * EmakiConteiner が毎 render で isPlayModeRef.current を同期する。
 */
export const EmakiViewerPlaybackContext = createContext({ current: false });

export const useIsPlayModeRef = () => useContext(EmakiViewerPlaybackContext);
