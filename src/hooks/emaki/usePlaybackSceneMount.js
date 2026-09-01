import { AppContext } from "@/context/AppContext";
import { useEmakiViewerPlayback } from "@/context/EmakiViewerPlaybackContext";
import { isInPlaybackDomWindow } from "@/libs/emakiImageLoading/playbackDomWindow";
import {
  buildPlaybackImageUrl,
  ensurePlaybackImagePreloaded,
  isPlaybackImageDecoded,
} from "@/libs/emakiImageLoading/playbackPreload";
import { useContext, useEffect, useState } from "react";

/**
 * 再生中: DOM window 内かつ decode 完了後のみ EmakiImage をマウント可。
 * 停止中は常に true。
 */
const usePlaybackSceneMount = (uniqueIndex, item, cat) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);
  const {
    isPlayModeRef,
    prefetchSceneIndexRef,
    playbackSyncTick,
    subscribePlaybackEager,
  } = useEmakiViewerPlayback();

  const isPlayMode = isPlayModeRef.current;
  const prefetchIndex = prefetchSceneIndexRef.current;
  const viewport = { toggleFullscreen, orientation };

  const [inDomWindow, setInDomWindow] = useState(() =>
    !isPlayMode || isInPlaybackDomWindow(uniqueIndex, prefetchIndex)
  );

  const [decodeReady, setDecodeReady] = useState(() => {
    if (!isPlayMode || cat !== "image") return true;
    if (!isInPlaybackDomWindow(uniqueIndex, prefetchIndex)) return false;
    const url = buildPlaybackImageUrl(item, viewport);
    return !url || isPlaybackImageDecoded(url);
  });

  useEffect(() => {
    if (!isPlayModeRef.current) {
      setInDomWindow(true);
      return undefined;
    }
    setInDomWindow(
      isInPlaybackDomWindow(uniqueIndex, prefetchSceneIndexRef.current)
    );
    if (!subscribePlaybackEager) return undefined;

    return subscribePlaybackEager((oldIndex, newIndex) => {
      const nowIn = isInPlaybackDomWindow(uniqueIndex, newIndex);
      const wasIn = isInPlaybackDomWindow(uniqueIndex, oldIndex);
      if (nowIn !== wasIn) setInDomWindow(nowIn);
    });
  }, [
    subscribePlaybackEager,
    uniqueIndex,
    playbackSyncTick,
    isPlayModeRef,
    prefetchSceneIndexRef,
  ]);

  useEffect(() => {
    if (!isPlayModeRef.current || cat !== "image") {
      setDecodeReady(true);
      return undefined;
    }
    if (!inDomWindow) {
      setDecodeReady(false);
      return undefined;
    }

    const url = buildPlaybackImageUrl(item, viewport);
    if (!url) {
      setDecodeReady(true);
      return undefined;
    }
    if (isPlaybackImageDecoded(url)) {
      setDecodeReady(true);
      return undefined;
    }

    setDecodeReady(false);
    let cancelled = false;
    ensurePlaybackImagePreloaded(item, viewport).then(() => {
      if (!cancelled) setDecodeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    inDomWindow,
    cat,
    uniqueIndex,
    playbackSyncTick,
    item,
    toggleFullscreen,
    orientation,
    isPlayModeRef,
  ]);

  if (!isPlayMode) return true;
  if (!inDomWindow) return false;
  if (cat !== "image") return true;
  return decodeReady;
};

export default usePlaybackSceneMount;
