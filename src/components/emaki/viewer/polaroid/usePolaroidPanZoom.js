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

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_PAN_ZOOM = true;

function logDebug(tag, ...args) {
  if (!DEBUG_PAN_ZOOM) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maxPanForAxis(natural, photoDim, coverScale, zoom) {
  return Math.max(0, (natural * coverScale * zoom - photoDim) / 2);
}

function panoramaNudgeX(prevImg, nextImg, coverScale, zoom) {
  const prevW = prevImg?.naturalWidth ? prevImg.naturalWidth * coverScale * zoom : 0;
  const nextW = nextImg?.naturalWidth ? nextImg.naturalWidth * coverScale * zoom : 0;
  return (prevW - nextW) / 2;
}

function computeMaxPanLimits(img, z, prevImg, nextImg) {
  if (!img?.naturalWidth) return { x: 0, y: 0 };
  const cs = coverScaleFor(img, PHOTO_DW, PHOTO_DH);
  const baseX = maxPanForAxis(img.naturalWidth, PHOTO_DW, cs, z);
  const prevW = prevImg?.naturalWidth ? prevImg.naturalWidth * cs * z : 0;
  const nextW = nextImg?.naturalWidth ? nextImg.naturalWidth * cs * z : 0;
  return {
    x: baseX + (prevW + nextW) / 2,
    y: maxPanForAxis(img.naturalHeight, PHOTO_DH, cs, z),
  };
}

/** 枠中心基準のクライアント座標 → PHOTO_DW 論理座標（pan と同じ空間） */
function clientFocalToLogical(frameEl, clientX, clientY, frameW) {
  const r = frameW / PHOTO_DW;
  if (!frameEl || r <= 0) return { x: 0, y: 0 };
  const rect = frameEl.getBoundingClientRect();
  return {
    x: (clientX - (rect.left + rect.width / 2)) / r,
    y: (clientY - (rect.top + rect.height / 2)) / r,
  };
}

function resolvePanAfterZoom(prevZ, nextZ, pan, focal, loadedImages) {
  const { prev, current, next } = loadedImages;
  if (!current?.naturalWidth || prevZ <= 0 || Math.abs(nextZ - prevZ) < 1e-9) return pan;
  const cs = coverScaleFor(current, PHOTO_DW, PHOTO_DH);
  const nudge0 = panoramaNudgeX(prev, next, cs, prevZ);
  const nudge1 = panoramaNudgeX(prev, next, cs, nextZ);
  const ratio = nextZ / prevZ;
  const effX = (pan.x + nudge0) * ratio + focal.x * (1 - ratio);
  const effY = pan.y * ratio + focal.y * (1 - ratio);
  const limits = computeMaxPanLimits(current, nextZ, prev, next);
  return {
    x: clamp(effX - nudge1, -limits.x, limits.x),
    y: clamp(effY, -limits.y, limits.y),
  };
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
  /** 写真枠が DOM に載った後（PolaroidModal の mounted 等） */
  frameDomReady = true,
}) {
  // ---------------------------------------------------------------------------
  // 1. 状態管理（State）
  // ---------------------------------------------------------------------------
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [maxPan, setMaxPan] = useState({ x: 0, y: 0 });
  const [coverScale, setCoverScale] = useState(1);
  const [imgSize, setImgSize] = useState(null);
  const [panoramaSlots, setPanoramaSlots] = useState({ prev: null, current: null, next: null });
  const [frameW, setFrameW] = useState(PHOTO_DW);
  const [dragging, setDragging] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. 参照管理（Refs）- 再レンダリングをトリガーしない値の保持
  // ---------------------------------------------------------------------------
  const dragStart = useRef({ x: 0, y: 0, pan: { x: 0, y: 0 } });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const loadedImagesRef = useRef({ prev: null, current: null, next: null });
  const loadIdRef = useRef(0);
  const frameRef = useRef(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const lastWheelStampRef = useRef(null);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  // 2点間のユークリッド距離（ピンチ操作用）
  function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // ---------------------------------------------------------------------------
  // [フロー 1] モーダルオープン時の同期初期化
  // isOpen が true になった瞬間、初期 Props を反映して以前のキャッシュをリセット
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      lastWheelStampRef.current = null;
      logDebug("ModalOpen:Reset", { initialIndex, initialZoom, initialPan });
      setSelectedIndex(initialIndex);
      setZoom(typeof initialZoom === "number" ? initialZoom : ZOOM_DEFAULT);
      setPan(initialPan && typeof initialPan.x === "number" ? initialPan : { x: 0, y: 0 });
      setPanoramaSlots({ prev: null, current: null, next: null });
      loadedImagesRef.current = { prev: null, current: null, next: null };
      setImgSize(null);
    }
  }, [isOpen, initialIndex, initialZoom, initialPan]);

  // ---------------------------------------------------------------------------
  // [計算関数] ズームや画像寸法に応じた Pan 可動域（maxPan）の再計算

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

    const nextMax = {
      x: baseX + (prevW + nextW) / 2,
      y: maxPanForAxis(img.naturalHeight, PHOTO_DH, cs, z),
    };
    logDebug("UpdatePanLimits", { zoom: z, nextMaxPan: nextMax });
    setMaxPan(nextMax);
  }, []);

 

  // ---------------------------------------------------------------------------
  // [フロー 2] 画像の非同期ロード＆スライス抽出
  // 選択されたインデックスを中心に、前後のパノラマスライスをロード
  // ---------------------------------------------------------------------------
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
    logDebug("ImageLoad:Start", { curIdx, prevIdx, nextIdx, loadId });

    Promise.all([
      loadCrossOriginImage(prevUrl),
      loadCrossOriginImage(curUrl),
      loadCrossOriginImage(nextUrl),
    ]).then(([prev, current, next]) => {
      // 連続切り替え時のレースコンディション防止
      if (loadId !== loadIdRef.current) {
        logDebug("ImageLoad:SkippedStale", { loadId });
        return;
      }
      loadedImagesRef.current = { prev, current, next };
      setPanoramaSlots({ prev, current, next });

      if (current?.naturalWidth) {
        logDebug("ImageLoad:Success", { w: current.naturalWidth, h: current.naturalHeight });
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

  // ---------------------------------------------------------------------------
  // [フロー 3] 写真枠（DOM）寸法の監視
  // ---------------------------------------------------------------------------
  // useEffect(() => {
  //   if (!isOpen || !frameRef.current) return;
  //   const el = frameRef.current;
  //   const measure = () => {
  //     const nextW = el.clientWidth || PHOTO_DW;
  //     logDebug("FrameMeasure", { clientWidth: el.clientWidth, nextW });
  //     setFrameW(nextW);
  //   };
  //   measure();
  //   const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
  //   ro?.observe(el);
  //   return () => ro?.disconnect();
  // }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !frameDomReady || !frameRef.current) return;
    const el = frameRef.current;
    const measure = () => {
      const nextW = el.clientWidth || PHOTO_DW;
      setFrameW((prev) => {
        if (Math.abs(prev - nextW) < 1) return prev; // 1px未満の変動は無視して再レンダリングを遮断
        logDebug("FrameMeasure", { clientWidth: el.clientWidth, prevW: prev, nextW });
        return nextW;
      });
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [isOpen, frameDomReady]);

  // zoom / pan を同期適用（setZoom updater 内の副作用を避ける）
  const applyZoomWithPan = useCallback((nextZ, focal) => {
    const prevZ = zoomRef.current;
    const clampedZ = clamp(nextZ, ZOOM_MIN, ZOOM_MAX);
    if (Math.abs(clampedZ - prevZ) < 1e-9) return null;

    const nextPan = resolvePanAfterZoom(
      prevZ,
      clampedZ,
      panRef.current,
      focal,
      loadedImagesRef.current
    );
    zoomRef.current = clampedZ;
    panRef.current = nextPan;
    setZoom(clampedZ);
    setPan(nextPan);
    return { prevZ, nextZ: clampedZ };
  }, []);

  // ---------------------------------------------------------------------------
  // [フロー 4] マウスホイールズーム操作（DOM 接続後に React onWheel で受ける）
  // ---------------------------------------------------------------------------
  const handleFrameWheel = useCallback(
    (e) => {
      if (!isOpen) return;
      if (e.timeStamp === lastWheelStampRef.current) return;
      lastWheelStampRef.current = e.timeStamp;

      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const zoomFactor = delta < 0 ? 1.08 : 0.92;

      const r = frameW / PHOTO_DW;
      if (r <= 0) return;
      const el = frameRef.current;
      const focal = clientFocalToLogical(el, e.clientX, e.clientY, frameW);

      const prevZ = zoomRef.current;
      const nextZ = prevZ * zoomFactor;
      const applied = applyZoomWithPan(nextZ, focal);
      if (applied) {
        logDebug("Wheel:Zoom", {
          prevZoom: applied.prevZ.toFixed(3),
          nextZoom: applied.nextZ.toFixed(3),
          deltaY: e.deltaY,
        });
      }
    },
    [isOpen, frameW, applyZoomWithPan]
  );

  // ---------------------------------------------------------------------------
  // [フロー 5] ズーム値変更による maxPan（可動域）の再計算
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const { prev, current, next } = loadedImagesRef.current;
    if (current?.naturalWidth) {
      logDebug("Effect:ZoomChanged -> updatePanLimits", { zoom });
      updatePanLimits(current, zoom, prev, next);
    }
  }, [zoom, updatePanLimits]);


  // ---------------------------------------------------------------------------
  // [フロー 6] 可動域変更による pan のクランプ制限
  // ※ズーム操作中の座標破壊を防ぐため、Effect での強制上書きをバイパス
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // ズーム操作時の Effect:Clamp OVERWRITE を遮断
    /*
    if (!imgSize?.w || (maxPan.x === 0 && maxPan.y === 0)) return;

    setPan((prev) => {
      const nextX = clamp(prev.x, -maxPan.x, maxPan.x);
      const nextY = clamp(prev.y, -maxPan.y, maxPan.y);
      return { x: nextX, y: nextY };
    });
    */
  }, [maxPan.x, maxPan.y, imgSize]);

  // ---------------------------------------------------------------------------
  // [フロー 7] ポインタ操作（ドラッグ＆ピンチズーム）
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const pts = pointersRef.current;

    logDebug("Pointer:Down", { pointerId: e.pointerId, totalPointers: pts.size });

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
      if (d0 > 0) {
        const prevZ = zoomRef.current;
        const nextZ = clamp(zoom0 * (d / d0), ZOOM_MIN, ZOOM_MAX);
        if (Math.abs(nextZ - prevZ) >= 1e-9) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const focal = clientFocalToLogical(frameRef.current, midX, midY, frameW);
          applyZoomWithPan(nextZ, focal);
        }
      }
      return;
    }

    if (!dragging || pts.size !== 1) return;

    // Ctrl + ドラッグによるズーム
    if (e.ctrlKey || e.metaKey || dragStart.current.isCtrlZoom) {
      const dy = dragStart.current.y - e.clientY;
      const baseZoom = dragStart.current.zoom0 || zoom;
      const nextZoom = baseZoom * Math.exp(dy * 0.006);
      applyZoomWithPan(nextZoom, { x: 0, y: 0 });
      return;
    }

    // 通常の1本指パン（ドラッグ）移動
    const r = frameW / PHOTO_DW;
    if (r <= 0) return;
    const deltaX = (e.clientX - dragStart.current.x) / r;
    const deltaY = (e.clientY - dragStart.current.y) / r;

    const nextPan = {
      x: clamp(dragStart.current.pan.x + deltaX, -maxPan.x, maxPan.x),
      y: clamp(dragStart.current.pan.y + deltaY, -maxPan.y, maxPan.y),
    };
    setPan(nextPan);
  };

  const handlePointerUp = (e) => {
    logDebug("Pointer:Up", { pointerId: e.pointerId });
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
    handleFrameWheel,
  };
}