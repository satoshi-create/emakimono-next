import { createContext, useContext } from "react";

const defaultPlaybackContext = {
  isPlayModeRef: { current: false },
  prefetchSceneIndexRef: { current: 0 },
  playbackSyncTick: 0,
  subscribePlaybackEager: null,
};

/**
 * 再生モード ref（安定参照）。LazyImage の memo を崩さず再生状態・先読み index を読む。
 * playbackSyncTick — 再生開始/停止時の表示モード切替（全ツリー更新）。
 *
 * subscribePlaybackEager: 先読み index 更新時に、再生表示対象（eager 範囲）を
 * LazyImage ごとに局部再描画させる購読登録。Context 経由の全ツリー再レンダーを
 * 避けるため、変更のあった LazyImage だけが自分の eager 判定を再評価する。
 */
export const EmakiViewerPlaybackContext = createContext(defaultPlaybackContext);

export const useEmakiViewerPlayback = () => useContext(EmakiViewerPlaybackContext);

export const useIsPlayModeRef = () =>
  useContext(EmakiViewerPlaybackContext).isPlayModeRef;

export const usePrefetchSceneIndexRef = () =>
  useContext(EmakiViewerPlaybackContext).prefetchSceneIndexRef;
