/**
 * useEmakiZoomPan — ズーム＆パン状態管理（兄弟オーバーレイ方式）。
 *
 * 既存の useEmakiScroll / useEmakiPalmDrag / useScrollPositionRestore には触れず、
 * ZoomLayer 内で完結して scale / panX / panY を管理する。RTL の横スクロール座標系や
 * 背後の <article> のイベントには一切干渉しない。
 */
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_SCALE = 1.8;
const MIN_SCALE = 1;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.2;
const WHEEL_ZOOM_RATE = 0.002;

const clampScale = (value) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

export default function useEmakiZoomPan({ onOpen } = {}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const zoomRef = useRef(null);
  const dragRef = useRef(null);
  const isZoomedRef = useRef(false);

  const resetZoom = useCallback(() => {
    isZoomedRef.current = false;
    setIsZoomed(false);
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    dragRef.current = null;
  }, []);

  const openZoom = useCallback(() => {
    isZoomedRef.current = true;
    setIsZoomed(true);
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    if (typeof onOpen === "function") onOpen();
  }, [onOpen]);

  const zoomIn = useCallback(
    () => setScale((prev) => clampScale(prev + ZOOM_STEP)),
    []
  );
  const zoomOut = useCallback(
    () => setScale((prev) => clampScale(prev - ZOOM_STEP)),
    []
  );

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
      setScale((prev) => clampScale(prev - delta * WHEEL_ZOOM_RATE));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isZoomed]);

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

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    setPanX((prev) => prev + (event.clientX - drag.x));
    setPanY((prev) => prev + (event.clientY - drag.y));
    drag.x = event.clientX;
    drag.y = event.clientY;
  }, []);

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
