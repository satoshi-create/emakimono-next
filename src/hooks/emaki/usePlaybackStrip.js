import { useCallback, useRef, useState } from "react";
import {
  getPlaybackSpeedPxPerSec,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";
import {
  cacheKeyForSegment,
  clearPlaybackImageCache,
  getPlaybackImageDisplayUrl,
  prefetchPlaybackImage,
} from "@/utils/playbackImageCache";
import {
  buildSlotWindow,
  buildTrackFromArticle,
  computeMaxScrollPx,
  computeStripTranslateX,
  findSegmentIndexAtOffset,
  offsetToScrollLeft,
  scrollLeftToOffset,
} from "@/utils/playbackTrackLayout";

const MAX_DT_SEC = 0.05;

function resolveCenterIndex(segments, offsetPx) {
  let centerIndex = findSegmentIndexAtOffset(segments, offsetPx);

  while (
    centerIndex < segments.length - 1 &&
    offsetPx >= segments[centerIndex].startPx + segments[centerIndex].widthPx
  ) {
    centerIndex += 1;
  }
  while (centerIndex > 0 && offsetPx < segments[centerIndex].startPx) {
    centerIndex -= 1;
  }

  return centerIndex;
}

/**
 * Playback Surface: offset tick + 先読み decode + DOM transform（Step 2）
 */
const usePlaybackStrip = ({
  articleRef,
  processedEmakis,
  lastDetectedSceneRef,
  isAtStartRef,
  isAtEndRef,
  indicatorElRef,
  isDesktopRef,
  onPlayheadSceneChange,
}) => {
  const trackRef = useRef([]);
  const maxScrollPxRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const centerIndexRef = useRef(0);
  const lastTsRef = useRef(null);
  const offsetRef = useRef(0);
  const isActiveRef = useRef(false);
  const stripTrackRef = useRef(null);
  const lastDisplayUrlRef = useRef(new Map());
  const prefetchGenerationRef = useRef(0);
  const onImageDecodedRef = useRef(() => {});

  const [slots, setSlots] = useState([]);
  const [isActive, setIsActive] = useState(false);

  const updateIndicator = useCallback(
    (ratio) => {
      const el = indicatorElRef?.current;
      if (!el) return;
      const trackW = isDesktopRef?.current ? 180 : 120;
      const dotW = isDesktopRef?.current ? 8 : 6;
      el.style.left = `${ratio * (trackW - dotW)}px`;
    },
    [indicatorElRef, isDesktopRef]
  );

  const syncEdgeRefs = useCallback(
    (offsetPx) => {
      const max = maxScrollPxRef.current;
      if (max <= 0) return;
      const atStart = offsetPx < 5;
      const atEnd = offsetPx >= max - 5;
      if (isAtStartRef) isAtStartRef.current = atStart;
      if (isAtEndRef) isAtEndRef.current = atEnd;
    },
    [isAtStartRef, isAtEndRef]
  );

  const applyStripTransform = useCallback((segments, centerIndex, offsetPx) => {
    const trackEl = stripTrackRef.current;
    if (!trackEl || !segments.length) return;

    const translateX = computeStripTranslateX(
      segments,
      centerIndex,
      offsetPx,
      viewportWidthRef.current
    );
    trackEl.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }, []);

  const enrichSlots = useCallback((rawSlots) => {
    return rawSlots.map((slot) => {
      if (!slot.imageUrl) {
        return { ...slot, displayUrl: null, ready: true };
      }

      const key = cacheKeyForSegment(slot);
      const cached = key ? getPlaybackImageDisplayUrl(key) : null;
      const fallback = lastDisplayUrlRef.current.get(slot.sceneIndex) ?? null;
      const displayUrl = cached || fallback;

      if (displayUrl) {
        lastDisplayUrlRef.current.set(slot.sceneIndex, displayUrl);
      }

      return {
        ...slot,
        displayUrl,
        ready: Boolean(cached),
      };
    });
  }, []);

  const prefetchAhead = useCallback((segments, centerIndex) => {
    const generation = prefetchGenerationRef.current;
    const indices = [];
    for (let i = centerIndex; i < segments.length; i += 1) indices.push(i);
    for (let i = centerIndex - 1; i >= 0; i -= 1) indices.push(i);

    let imageBudget = PLAYBACK_IMAGE_LOOKAHEAD;

    for (const i of indices) {
      if (imageBudget < 0) break;
      const seg = segments[i];
      if (!seg?.imageUrl || seg.uniqueIndex == null) continue;

      const key = cacheKeyForSegment(seg);
      if (!key) continue;

      imageBudget -= 1;
      prefetchPlaybackImage(key, seg.imageUrl).then((url) => {
        if (
          generation !== prefetchGenerationRef.current ||
          !isActiveRef.current ||
          !url
        ) {
          return;
        }
        lastDisplayUrlRef.current.set(seg.sceneIndex, url);
        onImageDecodedRef.current();
      });
    }
  }, []);

  onImageDecodedRef.current = () => {
    const segments = trackRef.current;
    if (!segments.length || !isActiveRef.current) return;
    setSlots(
      enrichSlots(buildSlotWindow(segments, centerIndexRef.current))
    );
  };

  const buildAndSetSlots = useCallback(
    (segments, centerIndex) => {
      setSlots(enrichSlots(buildSlotWindow(segments, centerIndex)));
      prefetchAhead(segments, centerIndex);
    },
    [enrichSlots, prefetchAhead]
  );

  const applyOffset = useCallback(
    (offsetPx) => {
      const segments = trackRef.current;
      if (!segments.length) return;

      const centerIndex = resolveCenterIndex(segments, offsetPx);
      const centerChanged = centerIndex !== centerIndexRef.current;

      centerIndexRef.current = centerIndex;
      offsetRef.current = offsetPx;

      applyStripTransform(segments, centerIndex, offsetPx);

      if (centerChanged) {
        buildAndSetSlots(segments, centerIndex);
      }

      const sceneIndex = segments[centerIndex]?.sceneIndex;
      if (sceneIndex != null && lastDetectedSceneRef) {
        if (lastDetectedSceneRef.current !== sceneIndex) {
          onPlayheadSceneChange?.(sceneIndex);
        }
        lastDetectedSceneRef.current = sceneIndex;
      }

      syncEdgeRefs(offsetPx);
      const max = maxScrollPxRef.current;
      if (max > 0) updateIndicator(offsetPx / max);
    },
    [
      applyStripTransform,
      buildAndSetSlots,
      lastDetectedSceneRef,
      onPlayheadSceneChange,
      syncEdgeRefs,
      updateIndicator,
    ]
  );

  const initFromScrollLeft = useCallback(() => {
    const el = articleRef.current;
    if (!el) return false;

    const segments = buildTrackFromArticle(el, processedEmakis);
    if (!segments.length) return false;

    prefetchGenerationRef.current += 1;
    trackRef.current = segments;
    viewportWidthRef.current = el.clientWidth;
    maxScrollPxRef.current = computeMaxScrollPx(segments, el);
    lastTsRef.current = null;
    lastDisplayUrlRef.current = new Map();
    centerIndexRef.current = -1;

    isActiveRef.current = true;
    setIsActive(true);

    applyOffset(scrollLeftToOffset(el.scrollLeft));
    return true;
  }, [articleRef, processedEmakis, applyOffset]);

  const syncScrollLeftFromOffset = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;
    el.scrollLeft = offsetToScrollLeft(offsetRef.current, maxScrollPxRef.current);
    syncEdgeRefs(offsetRef.current);
  }, [articleRef, syncEdgeRefs]);

  const reset = useCallback(() => {
    prefetchGenerationRef.current += 1;
    trackRef.current = [];
    maxScrollPxRef.current = 0;
    viewportWidthRef.current = 0;
    centerIndexRef.current = 0;
    lastTsRef.current = null;
    offsetRef.current = 0;
    isActiveRef.current = false;
    lastDisplayUrlRef.current = new Map();

    const trackEl = stripTrackRef.current;
    if (trackEl) {
      trackEl.style.transform = "";
    }

    clearPlaybackImageCache();
    setIsActive(false);
    setSlots([]);
  }, []);

  const tick = useCallback(
    (timestampMs) => {
      const max = maxScrollPxRef.current;
      if (!isActiveRef.current || max <= 0) return { reachedEnd: false };

      if (lastTsRef.current == null) lastTsRef.current = timestampMs;
      const dt = Math.min((timestampMs - lastTsRef.current) / 1000, MAX_DT_SEC);
      lastTsRef.current = timestampMs;

      const nextOffset = offsetRef.current + getPlaybackSpeedPxPerSec() * dt;

      if (nextOffset >= max) {
        applyOffset(max);
        return { reachedEnd: true };
      }

      applyOffset(nextOffset);
      return { reachedEnd: false };
    },
    [applyOffset]
  );

  return {
    slots,
    stripTrackRef,
    isActive,
    initFromScrollLeft,
    syncScrollLeftFromOffset,
    tick,
    reset,
  };
};

export default usePlaybackStrip;
