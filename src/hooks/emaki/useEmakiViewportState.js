import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackManualScroll } from "@/libs/api/measurementUtils";
import { resolveViewerLayoutMode } from "@/theme/colorMode";

export default function useEmakiViewportState({
  orientation,
  toggleFullscreen,
  data,
  query,
  pathname,
  replace,
  isPalmMode,
  detectCurrentSceneRef,
  isPlayMode,
  stopPlayMode,
  isAutoScrolling,
  emakiId,
  suppressClickUntilRef,
  touchDoubleTapAtRef,
  handleFullScreen,
  setOepnSidebar,
  handleRailTouchStart,
  handleRailTouchEnd,
}) {
  const [isMdLandscape, setIsMdLandscape] = useState(false);
  const commentaryFloating = Boolean(toggleFullscreen) || isMdLandscape;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setIsMdLandscape(orientation === "landscape" && mq.matches);
    };
    update();
    mq.addEventListener?.("change", update);
    window.addEventListener("orientationchange", update);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [orientation]);

  const wasPalmActiveRef = useRef(false);
  useEffect(() => {
    if (isPalmMode) {
      wasPalmActiveRef.current = true;
      return undefined;
    }
    if (!wasPalmActiveRef.current) return undefined;
    wasPalmActiveRef.current = false;
    const t = setTimeout(() => {
      if (typeof detectCurrentSceneRef.current === "function") {
        detectCurrentSceneRef.current();
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isPalmMode]);

  const isEditSpotsMode =
    process.env.NODE_ENV === "development" &&
    (query?.editSpots === "1" ||
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("editSpots") === "1"));

  const handleToggleEditSpots = () => {
    const nextQuery = { ...query };
    if (isEditSpotsMode) {
      delete nextQuery.editSpots;
    } else {
      nextQuery.editSpots = "1";
    }
    replace({ pathname, query: nextQuery }, undefined, { shallow: true });
  };

  const viewerLayout = resolveViewerLayoutMode({
    data,
    commentaryFloating,
    isFullscreen: toggleFullscreen,
  });

  const stageHandlers = {
    onClick: () => {
      if (isPlayMode) {
        stopPlayMode();
        return;
      }
      if (Date.now() < suppressClickUntilRef.current) return;
      setOepnSidebar(false);
    },
    onDoubleClick: (e) => {
      if (e.target.closest("button, a, [role='button']")) return;
      if (Date.now() < suppressClickUntilRef.current) return;
      if (Date.now() - touchDoubleTapAtRef.current < 600) return;
      handleFullScreen("landscape");
    },
    onTouchStart: (e) => {
      handleRailTouchStart(e);
      if (isPlayMode) {
        stopPlayMode();
      }
      if (!isAutoScrolling) {
        trackManualScroll(emakiId, "touch");
      }
    },
    onTouchEnd: (e) => {
      handleRailTouchEnd(e);
    },
  };

  return {
    commentaryFloating,
    viewerLayout,
    isEditSpotsMode,
    handleToggleEditSpots,
    stageHandlers,
  };
}