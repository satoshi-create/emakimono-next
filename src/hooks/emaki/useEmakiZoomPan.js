/**
 * useEmakiZoomPan — ズーム＆パン状態管理（兄弟オーバーレイ方式）。
 *
 * 既存の useEmakiScroll / useEmakiPalmDrag / useScrollPositionRestore には触れず、
 * ZoomLayer 内で完結して scale / panX / panY を管理する。RTL の横スクロール座標系や
 * 背後の <article> のイベントには一切干渉しない。
 *
 * pan はコンテンツ実寸（.strip）と可視領域（.stage）から算出した可動域へ
 * 常にクランプする。縮小時の最小倍率は「画像の縦幅がコンテナ縦幅に収まる fit」
 * を下限とし、上下に背景（黒帯）が露出しないようにする。
 */
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_SCALE = 1.8;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;
const WHEEL_ZOOM_RATE = 0.002;
const FALLBACK_MIN_SCALE = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

export default function useEmakiZoomPan({ onOpen } = {}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const zoomRef = useRef(null); // .layer（wheel ネイティブ登録・イベント委譲先）
  const stageRef = useRef(null); // .stage（可視ビューポート実寸）
  const stripRef = useRef(null); // .strip（画像帯 = コンテンツ実寸）
  const dragRef = useRef(null);
  const isZoomedRef = useRef(false);
  const scaleRef = useRef(DEFAULT_SCALE);
  const panRef = useRef({ x: 0, y: 0 });

  // 縦幅がコンテナに収まる倍率（これ以上縮小させない = 上下の背景露出を防ぐ）
  const getFitScale = useCallback(() => {
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!stage || !strip) return FALLBACK_MIN_SCALE;
    const stageH = stage.clientHeight || 0;
    const contentH = strip.offsetHeight || 0;
    if (!stageH || !contentH) return FALLBACK_MIN_SCALE;
    return Math.max(FALLBACK_MIN_SCALE, stageH / contentH);
  }, []);

  // scale 倍時の可動域（transform-origin: center center 前提）
  const getPanBounds = useCallback((nextScale) => {
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!stage || !strip) return { maxX: 0, maxY: 0 };
    const stageW = stage.clientWidth || 0;
    const stageH = stage.clientHeight || 0;
    const contentW = strip.offsetWidth || 0;
    const contentH = strip.offsetHeight || 0;
    return {
      maxX: Math.max(0, (contentW * nextScale - stageW) / 2),
      maxY: Math.max(0, (contentH * nextScale - stageH) / 2),
    };
  }, []);

  const clampPan = useCallback(
    (nextX, nextY, nextScale) => {
      const { maxX, maxY } = getPanBounds(nextScale);
      return [
        isFiniteNumber(nextX) ? clamp(nextX, -maxX, maxX) : 0,
        isFiniteNumber(nextY) ? clamp(nextY, -maxY, maxY) : 0,
      ];
    },
    [getPanBounds]
  );

  // scale と pan を同時に確定へ反映する（NaN / 極端値を常に補正）
  const applyScale = useCallback(
    (nextScale) => {
      const raw = isFiniteNumber(nextScale) ? nextScale : DEFAULT_SCALE;
      const safeScale = clamp(raw, getFitScale(), MAX_SCALE);
      const [nextX, nextY] = clampPan(
        panRef.current.x,
        panRef.current.y,
        safeScale
      );
      scaleRef.current = safeScale;
      panRef.current = { x: nextX, y: nextY };
      setScale(safeScale);
      setPanX(nextX);
      setPanY(nextY);
      return safeScale;
    },
    [clampPan, getFitScale]
  );

  const resetZoom = useCallback(() => {
    isZoomedRef.current = false;
    setIsZoomed(false);
    scaleRef.current = DEFAULT_SCALE;
    panRef.current = { x: 0, y: 0 };
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    dragRef.current = null;
  }, []);

  const openZoom = useCallback(() => {
    isZoomedRef.current = true;
    setIsZoomed(true);
    scaleRef.current = DEFAULT_SCALE;
    panRef.current = { x: 0, y: 0 };
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    if (typeof onOpen === "function") onOpen();
  }, [onOpen]);

  const zoomIn = useCallback(
    () => applyScale(scaleRef.current + ZOOM_STEP),
    [applyScale]
  );
  const zoomOut = useCallback(
    () => applyScale(scaleRef.current - ZOOM_STEP),
    [applyScale]
  );

  // ズーム進入直後（ref 実測後）に初期倍率・可動域を補正する
  useEffect(() => {
    if (!isZoomed) return undefined;
    applyScale(scaleRef.current);
    return undefined;
  }, [isZoomed, applyScale]);

  // リサイズ / 向き変更で可動域が変わるため再補正
  useEffect(() => {
    if (!isZoomed) return undefined;
    const onResize = () => applyScale(scaleRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isZoomed, applyScale]);

  // Escape キーでズーム解除（背後の UI へ伝播させない）
  useEffect(() => {
    if (!isZoomed) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      resetZoom();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isZoomed, resetZoom]);

  // ホイール: React の合成 onWheel は passive のためネイティブ登録で preventDefault する。
  // 背後の <article>（useEmakiScroll の wheel ハンドラ）へは stopPropagation で透過させない。
  useEffect(() => {
    const el = zoomRef.current;
    if (!isZoomed || !el) return undefined;
    const onWheel = (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (!event.deltaY) return;
      // Firefox 等の deltaMode（1: line, 2: page）を px 相当へ正規化
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const delta = event.deltaY * unit;
      applyScale(scaleRef.current - delta * WHEEL_ZOOM_RATE);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isZoomed, applyScale]);

  const onPointerDown = useCallback((event) => {
    // コントロールUI（ボタン）上の押下時はドラッグを開始せず、通常のclickを通す
    if (event.target.closest?.("button, a, [role='button']")) return;

    // ブラウザ標準の画像ドラッグ／テキスト選択によるパン中断を防止
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.stopPropagation();
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      const [nextX, nextY] = clampPan(
        panRef.current.x + (isFiniteNumber(dx) ? dx : 0),
        panRef.current.y + (isFiniteNumber(dy) ? dy : 0),
        scaleRef.current
      );
      panRef.current = { x: nextX, y: nextY };
      setPanX(nextX);
      setPanY(nextY);
    },
    [clampPan]
  );

  const onPointerEnd = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  return {
    isZoomed,
    scale,
    panX,
    panY,
    zoomRef,
    stageRef,
    stripRef,
    openZoom,
    resetZoom,
    zoomIn,
    zoomOut,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
