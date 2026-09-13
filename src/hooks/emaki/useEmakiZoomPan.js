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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
  // 拡大開始時に基準とするカーソル座標（viewport 座標）。null なら中央基準
  const focusPointRef = useRef({ x: null, y: null });
  // 直近のカーソル位置（+/- ボタン・ホイールでのズーム基準）
  const cursorRef = useRef({ x: null, y: null });
  // ダブルクリック判定（拡大中にダブルクリックで横スクロールへ戻す）
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  // タッチ（SP）: 1本指パン / 2本指ピンチの進行状態
  const touchRef = useRef({
    mode: null, // null | "pan" | "pinch"
    lastX: 0,
    lastY: 0,
    startDist: 0,
    startScale: DEFAULT_SCALE,
    prevCenterX: 0,
    prevCenterY: 0,
  });

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

  // scale と pan を同時に確定へ反映する（NaN / 極端値・可動域を常に補正）
  const commitScale = useCallback(
    (nextScale, nextX, nextY) => {
      const raw = isFiniteNumber(nextScale) ? nextScale : DEFAULT_SCALE;
      const safeScale = clamp(raw, getFitScale(), MAX_SCALE);
      const [x, y] = clampPan(nextX, nextY, safeScale);
      scaleRef.current = safeScale;
      panRef.current = { x, y };
      setScale(safeScale);
      setPanX(x);
      setPanY(y);
      return safeScale;
    },
    [clampPan, getFitScale]
  );

  const applyScale = useCallback(
    (nextScale) => commitScale(nextScale, panRef.current.x, panRef.current.y),
    [commitScale]
  );

  // カーソル位置（clientX / clientY）を固定したまま拡大縮小する。
  // transform-origin を動かす代わりに pan を逆算し、カーソル直下のコンテンツ座標を保つ。
  const applyScaleAtPoint = useCallback(
    (nextScale, focusX, focusY) => {
      const raw = isFiniteNumber(nextScale) ? nextScale : DEFAULT_SCALE;
      const targetScale = clamp(raw, getFitScale(), MAX_SCALE);
      const stage = stageRef.current;
      if (!stage || !isFiniteNumber(focusX) || !isFiniteNumber(focusY)) {
        return commitScale(targetScale, panRef.current.x, panRef.current.y);
      }
      const rect = stage.getBoundingClientRect();
      const fx = focusX - (rect.left + rect.width / 2);
      const fy = focusY - (rect.top + rect.height / 2);
      const prevScale =
        isFiniteNumber(scaleRef.current) && scaleRef.current > 0
          ? scaleRef.current
          : 1;
      // カーソル直下のコンテンツ座標 p = (focus - pan) / prevScale を固定する pan
      const nextX = fx - ((fx - panRef.current.x) / prevScale) * targetScale;
      const nextY = fy - ((fy - panRef.current.y) / prevScale) * targetScale;
      return commitScale(targetScale, nextX, nextY);
    },
    [commitScale, getFitScale]
  );

  const resetZoom = useCallback(() => {
    isZoomedRef.current = false;
    setIsZoomed(false);
    scaleRef.current = DEFAULT_SCALE;
    panRef.current = { x: 0, y: 0 };
    focusPointRef.current = { x: null, y: null };
    lastTapRef.current = { time: 0, x: 0, y: 0 };
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    dragRef.current = null;
    touchRef.current.mode = null;
    touchRef.current.startDist = 0;
  }, []);

  // focusX / focusY（clientX / clientY）を渡すと、その点を基準に拡大を開始する。
  // initialPanX: article の表示原点とオーバーレイ strip 原点を一致させる初期補正（P1）。
  // 実測前の初期フレームは等倍・補正済みパンで描画し、レイアウト確定後の
  // useLayoutEffect でカーソル基準の倍率・パンへ（ペイント前に）補正する。
  const openZoom = useCallback(
    (focusX, focusY, initialPanX) => {
      isZoomedRef.current = true;
      setIsZoomed(true);
      focusPointRef.current = {
        x: isFiniteNumber(focusX) ? focusX : null,
        y: isFiniteNumber(focusY) ? focusY : null,
      };
      const initialPan = isFiniteNumber(initialPanX) ? initialPanX : 0;
      scaleRef.current = FALLBACK_MIN_SCALE;
      panRef.current = { x: initialPan, y: 0 };
      setScale(FALLBACK_MIN_SCALE);
      setPanX(initialPan);
      setPanY(0);
      if (typeof onOpen === "function") onOpen();
    },
    [onOpen]
  );

  const zoomIn = useCallback(
    () =>
      applyScaleAtPoint(
        scaleRef.current + ZOOM_STEP,
        cursorRef.current.x,
        cursorRef.current.y
      ),
    [applyScaleAtPoint]
  );
  const zoomOut = useCallback(
    () =>
      applyScaleAtPoint(
        scaleRef.current - ZOOM_STEP,
        cursorRef.current.x,
        cursorRef.current.y
      ),
    [applyScaleAtPoint]
  );

  // ズーム進入直後（ref 実測後・ペイント前）にカーソル基準の初期倍率・パンを確定する
  useLayoutEffect(() => {
    if (!isZoomed) return undefined;
    const { x, y } = focusPointRef.current;
    applyScaleAtPoint(DEFAULT_SCALE, x, y);
    return undefined;
  }, [isZoomed, applyScaleAtPoint]);

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
      cursorRef.current = { x: event.clientX, y: event.clientY };
      // Firefox 等の deltaMode（1: line, 2: page）を px 相当へ正規化
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const delta = event.deltaY * unit;
      applyScaleAtPoint(
        scaleRef.current - delta * WHEEL_ZOOM_RATE,
        event.clientX,
        event.clientY
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isZoomed, applyScaleAtPoint]);

  // タッチ（SP）: 1本指ドラッグでパン、2本指ピンチで拡大縮小。
  // React 合成イベントは passive のため、wheel と同様にネイティブ登録で preventDefault する。
  useEffect(() => {
    const el = zoomRef.current;
    if (!isZoomed || !el) return undefined;

    const onTouchStart = (event) => {
      if (event.target.closest?.("button, a, [role='button']")) return;
      const touches = event.touches;
      const t = touchRef.current;
      if (touches.length >= 2) {
        const [a, b] = [touches[0], touches[1]];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        t.mode = "pinch";
        t.startDist = dist > 0 ? dist : 1;
        t.startScale = scaleRef.current;
        t.prevCenterX = (a.clientX + b.clientX) / 2;
        t.prevCenterY = (a.clientY + b.clientY) / 2;
        cursorRef.current = { x: t.prevCenterX, y: t.prevCenterY };
        event.preventDefault();
        return;
      }
      if (touches.length === 1) {
        const p = touches[0];
        cursorRef.current = { x: p.clientX, y: p.clientY };
        // 拡大表示中のダブルタップ: 横スクロール画像の表示へ戻す
        const now = Date.now();
        const prev = lastTapRef.current;
        if (
          now - prev.time < 320 &&
          Math.abs(p.clientX - prev.x) < 24 &&
          Math.abs(p.clientY - prev.y) < 24
        ) {
          lastTapRef.current = { time: 0, x: 0, y: 0 };
          t.mode = null;
          event.preventDefault();
          resetZoom();
          return;
        }
        lastTapRef.current = { time: now, x: p.clientX, y: p.clientY };
        t.mode = "pan";
        t.lastX = p.clientX;
        t.lastY = p.clientY;
        event.preventDefault();
      }
    };

    const onTouchMove = (event) => {
      const touches = event.touches;
      const t = touchRef.current;
      if (touches.length >= 2) {
        const [a, b] = [touches[0], touches[1]];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const cx = (a.clientX + b.clientX) / 2;
        const cy = (a.clientY + b.clientY) / 2;
        if (t.mode !== "pinch") {
          // 2本目が後から触れた場合はこのフレームを基準にする
          t.mode = "pinch";
          t.startDist = dist > 0 ? dist : 1;
          t.startScale = scaleRef.current;
          t.prevCenterX = cx;
          t.prevCenterY = cy;
          return;
        }
        const ratio = dist > 0 && t.startDist > 0 ? dist / t.startDist : 1;
        const target = clamp(t.startScale * ratio, getFitScale(), MAX_SCALE);
        // ピンチ中心を基準に拡大縮小し、指の移動分は平行移動として加算する
        applyScaleAtPoint(target, t.prevCenterX, t.prevCenterY);
        const [nextX, nextY] = clampPan(
          panRef.current.x + (cx - t.prevCenterX),
          panRef.current.y + (cy - t.prevCenterY),
          scaleRef.current
        );
        panRef.current = { x: nextX, y: nextY };
        setPanX(nextX);
        setPanY(nextY);
        t.prevCenterX = cx;
        t.prevCenterY = cy;
        cursorRef.current = { x: cx, y: cy };
        event.preventDefault();
        return;
      }
      if (touches.length === 1) {
        const p = touches[0];
        if (t.mode !== "pan") {
          // ピンチ → 1本指へ移行: パン基準をリセット
          t.mode = "pan";
          t.lastX = p.clientX;
          t.lastY = p.clientY;
          return;
        }
        const dx = p.clientX - t.lastX;
        const dy = p.clientY - t.lastY;
        t.lastX = p.clientX;
        t.lastY = p.clientY;
        const [nextX, nextY] = clampPan(
          panRef.current.x + dx,
          panRef.current.y + dy,
          scaleRef.current
        );
        panRef.current = { x: nextX, y: nextY };
        setPanX(nextX);
        setPanY(nextY);
        cursorRef.current = { x: p.clientX, y: p.clientY };
        event.preventDefault();
      }
    };

    const onTouchEnd = (event) => {
      const touches = event.touches;
      const t = touchRef.current;
      if (touches.length === 1) {
        // ピンチ → 1本指パンへ移行
        t.mode = "pan";
        t.lastX = touches[0].clientX;
        t.lastY = touches[0].clientY;
        return;
      }
      if (touches.length === 0) {
        t.mode = null;
        t.startDist = 0;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isZoomed, applyScaleAtPoint, clampPan, getFitScale, resetZoom]);

  const onPointerDown = useCallback(
    (event) => {
      // コントロールUI（ボタン）上の押下時はドラッグを開始せず、通常のclickを通す
      if (event.target.closest?.("button, a, [role='button']")) return;

      // タッチはネイティブの onTouch*（パン/ピンチ）で処理するため pointer では扱わない
      if (event.pointerType === "touch") return;

      cursorRef.current = { x: event.clientX, y: event.clientY };

      // 拡大表示中のダブルクリック: 横スクロール画像の表示へ戻す
      const now = Date.now();
      const prev = lastTapRef.current;
      if (
        now - prev.time < 320 &&
        Math.abs(event.clientX - prev.x) < 8 &&
        Math.abs(event.clientY - prev.y) < 8
      ) {
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        event.preventDefault();
        event.stopPropagation();
        resetZoom();
        return;
      }
      lastTapRef.current = { time: now, x: event.clientX, y: event.clientY };

      // ブラウザ標準の画像ドラッグ／テキスト選択によるパン中断を防止
      event.preventDefault();
      event.stopPropagation();
      dragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [resetZoom]
  );

  const onPointerMove = useCallback(
    (event) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
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
