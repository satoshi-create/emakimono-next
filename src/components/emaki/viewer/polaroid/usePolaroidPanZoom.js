import { useCallback, useEffect, useRef, useState } from "react";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import {
  PHOTO_DW,
  PHOTO_DH,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  coverScaleFor,
} from "./polaroidCanvasRenderer";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maxPanForAxis(natural, photoDim, coverScale, zoom) {
  return Math.max(0, (natural * coverScale * zoom - photoDim) / 2);
}

export function loadCrossOriginImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function usePolaroidPanZoom({
  isOpen,
  scenes = [],
  initialIndex = 0,
  initialZoom,
  initialPan,
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [maxPan, setMaxPan] = useState({ x: 0, y: 0 });
  const [coverScale, setCoverScale] = useState(1);
  const [imgSize, setImgSize] = useState(null);
  const [panoramaSlots, setPanoramaSlots] = useState({ prev: null, current: null, next: null });
  const [frameW, setFrameW] = useState(PHOTO_DW);
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0, pan: { x: 0, y: 0 } });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const loadedImagesRef = useRef({ prev: null, current: null, next: null });
  const loadIdRef = useRef(0);
  const frameRef = useRef(null);

  function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // isOpen 遷移時同期リセット
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(initialIndex);
      setZoom(typeof initialZoom === "number" ? initialZoom : ZOOM_DEFAULT);
      setPan(initialPan && typeof initialPan.x === "number" ? initialPan : { x: 0, y: 0 });
      setPanoramaSlots({ prev: null, current: null, next: null });
      loadedImagesRef.current = { prev: null, current: null, next: null };
      setImgSize(null);
    }
  }, [isOpen, initialIndex, initialZoom, initialPan]);

  const updatePanLimits = useCallback((img, z, prevImg, nextImg) => {
    if (!img?.naturalWidth) {
      setCoverScale(1);
      setMaxPan({ x: 0, y: 0 });
      return;
    }
    const cs = coverScaleFor(img, PHOTO_DW, PHOTO_DH);
    setCoverScale(cs);
    const baseX = maxPanForAxis(img.naturalWidth, PHOTO_DW, cs, z);
    const prevW = prevImg?.naturalWidth ? prevImg.naturalWidth * cs * z : 0;
    const nextW = nextImg?.naturalWidth ? nextImg.naturalWidth * cs * z : 0;
    setMaxPan({
      x: baseX + (prevW + nextW) / 2,
      y: maxPanForAxis(img.naturalHeight, PHOTO_DH, cs, z),
    });
  }, []);

  // 画像の非同期ロード
  useEffect(() => {
    if (!isOpen) {
      setZoom(ZOOM_DEFAULT);
      setPan({ x: 0, y: 0 });
      setMaxPan({ x: 0, y: 0 });
      setCoverScale(1);
      setImgSize(null);
      loadedImagesRef.current = { prev: null, current: null, next: null };
      setPanoramaSlots({ prev: null, current: null, next: null });
      return;
    }

    const isPanoramaSlice = (item) => Boolean(item?.src) && item?.cat !== "ekotoba";

    const findPanoramaIndex = (startIdx, step) => {
      for (let i = startIdx; i >= 0 && i < scenes.length; i += step) {
        if (isPanoramaSlice(scenes[i])) return i;
      }
      return null;
    };

    let curIdx = selectedIndex;
    if (!isPanoramaSlice(scenes[curIdx])) {
      curIdx = findPanoramaIndex(curIdx, -1) ?? findPanoramaIndex(curIdx, 1);
    }

    if (curIdx == null) return;

    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);

    const curUrl = scenes[curIdx]?.src ? buildCloudinaryUrl(scenes[curIdx].src) : null;
    const prevUrl =
      prevIdx != null && scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
    const nextUrl =
      nextIdx != null && scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
    if (!curUrl) return;

    loadedImagesRef.current = { prev: null, current: null, next: null };
    setPanoramaSlots({ prev: null, current: null, next: null });
    setImgSize(null);

    const loadId = ++loadIdRef.current;
    Promise.all([
      loadCrossOriginImage(prevUrl),
      loadCrossOriginImage(curUrl),
      loadCrossOriginImage(nextUrl),
    ]).then(([prev, current, next]) => {
      if (loadId !== loadIdRef.current) return;
      loadedImagesRef.current = { prev, current, next };
      setPanoramaSlots({ prev, current, next });
      if (current?.naturalWidth) {
        setImgSize({ w: current.naturalWidth, h: current.naturalHeight });
        const openZoom = typeof initialZoom === "number" ? initialZoom : ZOOM_DEFAULT;
        updatePanLimits(current, openZoom, prev, next);
      } else {
        setImgSize(null);
        setMaxPan({ x: 0, y: 0 });
      }
      setPan(initialPan && typeof initialPan.x === "number" ? initialPan : { x: 0, y: 0 });
      setZoom(typeof initialZoom === "number" ? initialZoom : ZOOM_DEFAULT);
    });
  }, [isOpen, selectedIndex, scenes, initialPan, initialZoom, updatePanLimits]);

  // フレーム幅の測定
  useEffect(() => {
    if (!isOpen || !frameRef.current) return;
    const el = frameRef.current;
    const measure = () => setFrameW(el.clientWidth || PHOTO_DW);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [isOpen]);

  // ホイールズーム（Portal 展開後の frameRef マウントを確実に拾うため frameW / isOpen に連動）
  useEffect(() => {
    if (!isOpen || !frameRef.current) return;
    const el = frameRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const zoomFactor = delta < 0 ? 1.08 : 0.92;
      setZoom((prev) => Math.min(Math.max(prev * zoomFactor, ZOOM_MIN), ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen, frameW]);

  // ズーム更新時の可動域再計算
  useEffect(() => {
    const { prev, current, next } = loadedImagesRef.current;
    if (current?.naturalWidth) updatePanLimits(current, zoom, prev, next);
  }, [zoom, updatePanLimits]);

  // パン位置のクランプ制限
  useEffect(() => {
    if (!imgSize?.w || (maxPan.x === 0 && maxPan.y === 0)) return;
    setPan((prev) => ({
      x: clamp(prev.x, -maxPan.x, maxPan.x),
      y: clamp(prev.y, -maxPan.y, maxPan.y),
    }));
  }, [maxPan.x, maxPan.y, imgSize]);

  // ポインタ操作ハンドラー
  const handlePointerDown = (e) => {
    // ブラウザ標準の画像ドラッグやテキスト選択によるポインタ剥奪を無条件に防止
    e.preventDefault();
    e.stopPropagation();

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const pts = pointersRef.current;

    if (pts.size === 2) {
      setDragging(false);
      const [a, b] = [...pts.values()];
      pinchRef.current = { d0: pointerDistance(a, b), zoom0: zoom };
    } else if (pts.size === 1) {
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        pan: { ...pan },
        zoom0: zoom,
        isCtrlZoom: Boolean(e.ctrlKey || e.metaKey),
      };
    }
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = pointersRef.current;

    // 2本指ピンチ操作
    if (pts.size === 2 && pinchRef.current) {
      const [a, b] = [...pts.values()];
      const d = pointerDistance(a, b);
      const { d0, zoom0 } = pinchRef.current;
      if (d0 > 0) setZoom(clamp(zoom0 * (d / d0), ZOOM_MIN, ZOOM_MAX));
      return;
    }

    if (!dragging || pts.size !== 1) return;

    // Ctrl + ドラッグ（または押下時にCtrlが押されていた場合）: 上ドラッグで拡大、下ドラッグで縮小
    if (e.ctrlKey || e.metaKey || dragStart.current.isCtrlZoom) {
      const dy = dragStart.current.y - e.clientY;
      const baseZoom = dragStart.current.zoom0 || zoom;
      const nextZoom = baseZoom * Math.exp(dy * 0.006);
      setZoom(clamp(nextZoom, ZOOM_MIN, ZOOM_MAX));
      return;
    }

    // 通常の1本指パン移動
    const r = frameW / PHOTO_DW;
    if (r <= 0) return;
    const deltaX = (e.clientX - dragStart.current.x) / r;
    const deltaY = (e.clientY - dragStart.current.y) / r;
    setPan({
      x: clamp(dragStart.current.pan.x + deltaX, -maxPan.x, maxPan.x),
      y: clamp(dragStart.current.pan.y + deltaY, -maxPan.y, maxPan.y),
    });
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) setDragging(false);
  };

  return {
    selectedIndex,
    setSelectedIndex,
    zoom,
    setZoom,
    pan,
    setPan,
    maxPan,
    coverScale,
    imgSize,
    panoramaSlots,
    setPanoramaSlots,
    frameW,
    dragging,
    frameRef,
    loadedImagesRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
