/**
 * useEmakiZoomPan — ズーム＆パン状態管理（兄弟オーバーレイ方式）。
 *
 * 既存の useEmakiScroll / useEmakiPalmDrag / useScrollPositionRestore には触れず、
 * ZoomLayer 内で完結して scale / panX / panY を管理する。RTL の横スクロール座標系や
 * 背後の <article> のイベントには一切干渉しない。
 *
 * ジェスチャ（2本指ピンチ / Ctrl・⌘+ホイール / ズーム中のホイール）は
 * entry-container（containerRef）へ常時登録し、通常スクロールからズーム状態へ
 * モードレスに移行する。等倍（1.0）まで縮小すると通常スクロールへ自動復帰する。
 *
 * pan はコンテンツ実寸（.strip）と可視領域（.stage）から算出した可動域へ
 * 常にクランプする。縮小時の最小倍率は「画像の縦幅がコンテナ縦幅に収まる fit」
 * を下限とし、上下に背景（黒帯）が露出しないようにする。
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const DEFAULT_SCALE = 2;
// ズーム上限。屏風（舟木本など）はスライス幅が狭く 300% では人物が小さいため、
// 既定を 600% とし、maxScale prop（屏風 = 800%）で作品特性に応じて引き上げられる。
const MAX_SCALE = 6;
const HARD_MAX_SCALE = 10; // maxScale prop の安全上限（UI 表示・配信解像度の破綻防止）
const ZOOM_STEP = 0.2;
const WHEEL_ZOOM_RATE = 0.002;
const FALLBACK_MIN_SCALE = 1; // 等倍（これ以下は通常スクロールへ復帰）
// ピンチイン / ホイール縮小が等倍まで戻ったときの復帰判定閾値
const MIN_SCALE_EPSILON = 0.001;
// ジェスチャ中に一度でもこの値以上まで拡大した場合のみ「ピンチイン復帰」を有効にする
// （等倍で始まるピンチアウト開始直後に誤って即復帰しないためのガード）
const PINCH_PEAK_EPSILON = 0.05;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

export default function useEmakiZoomPan({
  onOpen,
  onDoubleTap,
  containerRef,
  requestZoomRef,
  maxScale: maxScaleProp,
} = {}) {
  // 作品特性に応じたズーム上限（未指定 = 600%、屏風 = 800%）。不正値は既定へ戻す。
  const maxScale = isFiniteNumber(maxScaleProp)
    ? clamp(maxScaleProp, FALLBACK_MIN_SCALE, HARD_MAX_SCALE)
    : MAX_SCALE;

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
  // 拡大開始時に基準とするカーソル座標（viewport 座標）と初期倍率。null なら中央基準
  const focusPointRef = useRef({ x: null, y: null, scale: DEFAULT_SCALE });
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
    peakScale: DEFAULT_SCALE, // このジェスチャで到達した最大倍率（ピンチイン復帰判定）
    exited: false, // 等倍へ復帰済み（指を離すまで再進入しない）
  });

  // ダブルタップ（全画面切替）は毎レンダー再生成されるため ref 経由で最新版を参照する
  const onDoubleTapRef = useRef(onDoubleTap);
  onDoubleTapRef.current = onDoubleTap;

  // 最小倍率（これ以上縮小させない = 背景露出を防ぐ）。
  // 縦幅の fit に加え、ストリップ幅がステージ幅に満たない場合の横幅カバーも考慮する
  // （改修Bで収集枚数を動的化しても、巻頭・巻末や極端な狭幅では不足しうるため）。
  const getFitScale = useCallback(() => {
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!stage || !strip) return FALLBACK_MIN_SCALE;
    const stageH = stage.clientHeight || 0;
    const stageW = stage.clientWidth || 0;
    const contentH = strip.offsetHeight || 0;
    const contentW = strip.offsetWidth || 0;
    if (!stageH || !contentH) return FALLBACK_MIN_SCALE;
    const heightFit = stageH / contentH;
    const widthFit = contentW > 0 ? stageW / contentW : FALLBACK_MIN_SCALE;
    return clamp(
      Math.max(FALLBACK_MIN_SCALE, heightFit, widthFit),
      FALLBACK_MIN_SCALE,
      maxScale
    );
  }, [maxScale]);

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

  // --- Android Chrome ラスタ固着対策 -------------------------------------------
  // 拡大時にコンポジタが等倍テクスチャを保持したまま GPU で引き伸ばす現象
  // （ラスタ固着）への対策。操作セッション中だけ will-change: transform を strip へ
  // 付与して合成レイヤーを作り直させ、確定時にサブピクセルの transform 変化を与えて
  // 現在倍率での再ラスタライズを強制する。
  // 常時付与は iOS WebKit の固着・GPU メモリ圧迫を招くため行わない。
  const rasterActiveRef = useRef(false); // ピンチ / ドラッグ / ホイール継続中
  const rasterStagingRafRef = useRef(0);
  const rasterRestoreRafRef = useRef(0);
  const rasterPendingRef = useRef(null); // { base, nudged } 一時的なサブピクセル変化
  const wheelSettleTimerRef = useRef(0);

  // 未実行のサブピクセル変化を即座に戻す（復元予約も破棄）
  const flushRasterNudge = useCallback(() => {
    const pending = rasterPendingRef.current;
    const el = stripRef.current;
    if (pending && el && el.style.transform === pending.nudged) {
      el.style.transform = pending.base;
    }
    rasterPendingRef.current = null;
    cancelAnimationFrame(rasterStagingRafRef.current);
    rasterStagingRafRef.current = 0;
    cancelAnimationFrame(rasterRestoreRafRef.current);
  }, []);

  // transform へ微小なスケール変化（+0.01%）を与える（肉眼では不可視・レイアウト影響なし）。
  // 平行移動だけではコンポジタのテクスチャ解像度が再計算されないため、
  // ラスタスケールの再計算を誘発する scale の変化を用いる。
  // React の再レンダーで transform が更新済みの場合は触らない。
  const applyRasterNudge = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const base = strip.style.transform;
    if (!base) return;
    const nudged = `${base} scale(1.0001)`;
    strip.style.transform = nudged;
    rasterPendingRef.current = { base, nudged };
    rasterRestoreRafRef.current = requestAnimationFrame(() => {
      const target = stripRef.current;
      const pending = rasterPendingRef.current;
      rasterPendingRef.current = null;
      if (!target || !pending) return;
      if (target.style.transform === pending.nudged) {
        target.style.transform = pending.base;
      }
      // ジェスチャ継続中でなければ合成レイヤーを解放する
      if (!rasterActiveRef.current) target.style.willChange = "";
    });
  }, []);

  // 二重 rAF: React の再レンダー（transform 反映）後にサブピクセル変化を与え、
  // コンポジタにキャッシュ破棄 → 現在倍率での再ラスタライズを行わせる。
  const scheduleRasterRefresh = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    el.style.willChange = "transform";
    flushRasterNudge();
    rasterStagingRafRef.current = requestAnimationFrame(() => {
      rasterStagingRafRef.current = requestAnimationFrame(() => {
        rasterStagingRafRef.current = 0;
        applyRasterNudge();
      });
    });
  }, [applyRasterNudge, flushRasterNudge]);

  // ジェスチャ中の連続 commit では nudge 実行中をスキップして間引く
  const requestRasterRefresh = useCallback(() => {
    if (rasterStagingRafRef.current || rasterPendingRef.current) return;
    scheduleRasterRefresh();
  }, [scheduleRasterRefresh]);

  // ジェスチャ開始: セッション中は will-change を維持して再ラスタライズを促す
  const beginRasterSession = useCallback(() => {
    rasterActiveRef.current = true;
    const el = stripRef.current;
    if (el) el.style.willChange = "transform";
  }, []);

  // ジェスチャ終了: 最終倍率で再ラスタライズしてから will-change を外す
  const endRasterSession = useCallback(() => {
    rasterActiveRef.current = false;
    scheduleRasterRefresh();
  }, [scheduleRasterRefresh]);

  // アンマウント時: 予約中の再ラスタライズとホイール停止タイマーを破棄
  useEffect(
    () => () => {
      cancelAnimationFrame(rasterStagingRafRef.current);
      cancelAnimationFrame(rasterRestoreRafRef.current);
      if (wheelSettleTimerRef.current) clearTimeout(wheelSettleTimerRef.current);
    },
    []
  );

  // scale と pan を同時に確定へ反映する（NaN / 極端値・可動域を常に補正）
  const commitScale = useCallback(
    (nextScale, nextX, nextY) => {
      const raw = isFiniteNumber(nextScale) ? nextScale : DEFAULT_SCALE;
      const safeScale = clamp(raw, getFitScale(), maxScale);
      const [x, y] = clampPan(nextX, nextY, safeScale);
      scaleRef.current = safeScale;
      panRef.current = { x, y };
      setScale(safeScale);
      setPanX(x);
      setPanY(y);
      // 確定直後に再ラスタライズを促す（Android Chrome の等倍テクスチャ固着対策）
      requestRasterRefresh();
      return safeScale;
    },
    [clampPan, getFitScale, maxScale, requestRasterRefresh]
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
      const targetScale = clamp(raw, getFitScale(), maxScale);
      const stage = stageRef.current;
      if (!stage || !isFiniteNumber(focusX) || !isFiniteNumber(focusY)) {
        return commitScale(targetScale, panRef.current.x, panRef.current.y);
      }
      const rect = stage.getBoundingClientRect();
      const stripRect = stripRef.current?.getBoundingClientRect();
      const originX = stripRect
        ? stripRect.left + stripRect.width / 2 - panRef.current.x
        : rect.left + rect.width / 2;
      const originY = stripRect
        ? stripRect.top + stripRect.height / 2 - panRef.current.y
        : rect.top + rect.height / 2;
      const fx = focusX - originX;
      const fy = focusY - originY;
      const prevScale =
        isFiniteNumber(scaleRef.current) && scaleRef.current > 0
          ? scaleRef.current
          : 1;
      // カーソル直下のコンテンツ座標 p = (focus - pan) / prevScale を固定する pan
      const nextX = fx - ((fx - panRef.current.x) / prevScale) * targetScale;
      const nextY = fy - ((fy - panRef.current.y) / prevScale) * targetScale;
      return commitScale(targetScale, nextX, nextY);
    },
    [commitScale, getFitScale, maxScale]
  );

  const resetZoom = useCallback(() => {
    isZoomedRef.current = false;
    setIsZoomed(false);
    scaleRef.current = DEFAULT_SCALE;
    panRef.current = { x: 0, y: 0 };
    focusPointRef.current = { x: null, y: null, scale: DEFAULT_SCALE };
    lastTapRef.current = { time: 0, x: 0, y: 0 };
    setScale(DEFAULT_SCALE);
    setPanX(0);
    setPanY(0);
    dragRef.current = null;
    touchRef.current.mode = null;
    touchRef.current.startDist = 0;
    // 等倍復帰: 指を離すまでピンチで再進入しない
    touchRef.current.exited = true;
    // ラスタセッションを終了し、未実行の再ラスタライズ予約を破棄する
    rasterActiveRef.current = false;
    flushRasterNudge();
    if (stripRef.current) stripRef.current.style.willChange = "";
  }, [flushRasterNudge]);

  // focusX / focusY（clientX / clientY）を渡すと、その点を基準に拡大を開始する。
  // initialPanX: article の表示中心とオーバーレイ strip 中心が指す内容の差分（P1）。
  //   コンテンツ座標系の値で受け取り、スクリーン px へは開始倍率を乗じて変換する
  //   （translate は scale の外側で適用されるため、倍率を掛けないと突入直後に位置が飛ぶ）。
  // 実測前の初期フレームは補正済みパンで描画し、レイアウト確定後の
  // useLayoutEffect でカーソル基準の倍率・パンへ（ペイント前に）補正する。
  const openZoom = useCallback(
    (focusX, focusY, initialPanX, initialScale) => {
      // 先に pan/scale を確定してから isZoomed を立てる。
      // （レイヤーは isZoomed=true で初描画されるため、未初期化値の描画＝ちらつきを防ぐ）
      // initialScale: ボタン/ダブルクリックは既定倍率、ピンチ/ホイールは等倍から開始する
      const startScale = isFiniteNumber(initialScale)
        ? clamp(initialScale, FALLBACK_MIN_SCALE, maxScale)
        : DEFAULT_SCALE;
      focusPointRef.current = {
        x: isFiniteNumber(focusX) ? focusX : null,
        y: isFiniteNumber(focusY) ? focusY : null,
        scale: startScale,
      };
      const initialPan =
        (isFiniteNumber(initialPanX) ? initialPanX : 0) * startScale;
      scaleRef.current = startScale;
      panRef.current = { x: initialPan, y: 0 };
      setScale(startScale);
      setPanX(initialPan);
      setPanY(0);
      // 実測後（useLayoutEffect・ペイント前）にカーソル基準の最終倍率・パンへ補正する
      isZoomedRef.current = true;
      setIsZoomed(true);
      if (typeof onOpen === "function") onOpen();
    },
    [onOpen, maxScale]
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
  const zoomOut = useCallback(() => {
    const applied = applyScaleAtPoint(
      scaleRef.current - ZOOM_STEP,
      cursorRef.current.x,
      cursorRef.current.y
    );
    // 等倍まで縮小したら通常スクロール状態へ自動復帰する（モードレス）
    if (applied <= getFitScale() + MIN_SCALE_EPSILON) resetZoom();
    return applied;
  }, [applyScaleAtPoint, getFitScale, resetZoom]);

  // 右下ズームボタン: 等倍（FALLBACK_MIN_SCALE）⇔ 既定倍率（DEFAULT_SCALE）をトグルする。
  // focusX / focusY 未指定なら表示中央基準で拡大する。
  const toggleZoom = useCallback(
    (focusX, focusY) => {
      if (isZoomedRef.current) {
        resetZoom();
        return;
      }
      if (typeof requestZoomRef?.current === "function") {
        requestZoomRef.current(focusX, focusY, DEFAULT_SCALE);
      }
    },
    [requestZoomRef, resetZoom]
  );

  // ズーム進入直後（ref 実測後・ペイント前）にカーソル基準の初期倍率・パンを確定する
  useLayoutEffect(() => {
    if (!isZoomed) return undefined;
    const { x, y, scale: focusScale } = focusPointRef.current;
    applyScaleAtPoint(focusScale, x, y);
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

  // ホイール / タッチ（SP・TB）: entry-container へ常時ネイティブ登録する。
  // ZoomLayer は isZoomed のときだけ描画されるため、レイヤー単体では
  // 「通常スクロール → ピンチ/ホイールでシームレスにズームへ」を拾えない。
  //  - 2本指ピンチアウト（タッチ）: 触れた瞬間に等倍でズーム状態へ入る（モードレス移行）
  //  - 2本指ピンチイン: 等倍まで縮小した時点で通常スクロール状態へ自動復帰
  //  - Ctrl/⌘ + ホイール（トラックパッドのピンチ）: カーソル位置基準で拡大
  //  - ズーム中のホイール: カーソル位置基準で拡大縮小
  //  通常のホイール回転は横スクロール（article のハンドラ）へ委ねる。
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return undefined;

    const onWheel = (event) => {
      if (!event.deltaY) return;
      const zooming = isZoomedRef.current;
      if (!zooming && !(event.ctrlKey || event.metaKey)) return;
      event.stopPropagation();
      event.preventDefault();
      // Firefox 等の deltaMode（1: line, 2: page）を px 相当へ正規化
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const delta = event.deltaY * unit;
      cursorRef.current = { x: event.clientX, y: event.clientY };
      if (!zooming) {
        // 等倍以下へ縮小する向きではズーム状態へ入らない
        if (delta >= 0) return;
        if (typeof requestZoomRef?.current === "function") {
          requestZoomRef.current(
            event.clientX,
            event.clientY,
            FALLBACK_MIN_SCALE
          );
        }
      }
      // ズーム操作セッション: ホイールが止まるまで will-change を維持する
      beginRasterSession();
      if (wheelSettleTimerRef.current) clearTimeout(wheelSettleTimerRef.current);
      wheelSettleTimerRef.current = setTimeout(() => {
        wheelSettleTimerRef.current = 0;
        endRasterSession();
      }, 160);
      const next = scaleRef.current - delta * WHEEL_ZOOM_RATE;
      focusPointRef.current = {
        x: event.clientX,
        y: event.clientY,
        scale: next,
      };
      const applied = applyScaleAtPoint(next, event.clientX, event.clientY);
      // 等倍まで縮小したら通常スクロール状態へ自動復帰する（モードレス）
      if (applied <= getFitScale() + MIN_SCALE_EPSILON) resetZoom();
    };

    const onTouchStart = (event) => {
      if (event.target.closest?.("button, a, [role='button']")) return;
      const touches = event.touches;
      const t = touchRef.current;
      if (touches.length >= 2) {
        const [a, b] = [touches[0], touches[1]];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const cx = (a.clientX + b.clientX) / 2;
        const cy = (a.clientY + b.clientY) / 2;
        t.exited = false;
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        // モードレス移行: 触れた瞬間に等倍でズーム状態へ入る
        if (
          !isZoomedRef.current &&
          typeof requestZoomRef?.current === "function"
        ) {
          requestZoomRef.current(cx, cy, FALLBACK_MIN_SCALE);
        }
        t.mode = "pinch";
        t.startDist = dist > 0 ? dist : 1;
        t.startScale = scaleRef.current;
        t.peakScale = scaleRef.current;
        t.prevCenterX = cx;
        t.prevCenterY = cy;
        cursorRef.current = { x: cx, y: cy };
        // ピンチ中は will-change を維持して再ラスタライズを促す
        beginRasterSession();
        event.preventDefault();
        return;
      }
      if (touches.length === 1) {
        const p = touches[0];
        cursorRef.current = { x: p.clientX, y: p.clientY };
        const now = Date.now();
        const prev = lastTapRef.current;
        const isDoubleTap =
          now - prev.time < 320 &&
          Math.abs(p.clientX - prev.x) < 24 &&
          Math.abs(p.clientY - prev.y) < 24;
        if (!isZoomedRef.current) {
          // 通常スクロール中: ダブルタップは全画面切替（ズームは発火させない）
          if (isDoubleTap) {
            lastTapRef.current = { time: 0, x: 0, y: 0 };
            // ブラウザ標準のダブルタップズーム（ページ拡大）を明示的に抑止
            event.preventDefault();
            if (typeof onDoubleTapRef.current === "function") {
              onDoubleTapRef.current();
            }
            return;
          }
          lastTapRef.current = { time: now, x: p.clientX, y: p.clientY };
          t.mode = null;
          return; // 1本指スワイプはネイティブの横スクロールへ委ねる
        }
        // 拡大表示中のダブルタップ: 等倍時と同様に全画面表示をトグル（等倍復帰はピンチインのみ）
        if (isDoubleTap) {
          lastTapRef.current = { time: 0, x: 0, y: 0 };
          t.mode = null;
          event.preventDefault();
          if (typeof onDoubleTapRef.current === "function") {
            onDoubleTapRef.current();
          }
          return;
        }
        lastTapRef.current = { time: now, x: p.clientX, y: p.clientY };
        t.mode = "pan";
        t.lastX = p.clientX;
        t.lastY = p.clientY;
        // パンドラッグ中も will-change を維持して再ラスタライズを促す
        beginRasterSession();
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
        // 等倍まで縮小して通常スクロールへ復帰済み: 指を離すまで再進入しない
        if (t.exited) {
          event.preventDefault();
          return;
        }
        if (!isZoomedRef.current) {
          // 等倍へ戻した直後に再び広げた場合は再度ズーム状態へ入る（モードレス）
          if (typeof requestZoomRef?.current !== "function") return;
          requestZoomRef.current(cx, cy, FALLBACK_MIN_SCALE);
        }
        if (t.mode !== "pinch") {
          // 2本目が後から触れた場合はこのフレームを基準にする
          t.mode = "pinch";
          t.startDist = dist > 0 ? dist : 1;
          t.startScale = scaleRef.current;
          t.peakScale = scaleRef.current;
          t.prevCenterX = cx;
          t.prevCenterY = cy;
          event.preventDefault();
          return;
        }
        const ratio = dist > 0 && t.startDist > 0 ? dist / t.startDist : 1;
        const minScale = getFitScale();
        const rawTarget = t.startScale * ratio;
        if (rawTarget > t.peakScale) t.peakScale = rawTarget;
        // ピンチイン: 等倍まで縮小した時点で通常スクロール状態へ自動復帰する
        if (
          rawTarget <= minScale + MIN_SCALE_EPSILON &&
          t.peakScale > minScale + PINCH_PEAK_EPSILON
        ) {
          t.mode = "pinch";
          t.exited = true;
          event.preventDefault();
          resetZoom();
          return;
        }
        const target = clamp(rawTarget, minScale, maxScale);
        // ピンチ中心を基準に拡大縮小し、指の移動分は平行移動として加算する
        focusPointRef.current = {
          x: t.prevCenterX,
          y: t.prevCenterY,
          scale: target,
        };
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
        if (!isZoomedRef.current) return; // 通常スクロールはネイティブに委ねる
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
        t.exited = false;
        // 操作確定: 最終倍率で再ラスタライズしてから will-change を外す
        endRasterSession();
      }
    };

    // iOS Safari はピンチを独自の gesture* イベントでも処理する。
    // touch-action: pan-x pan-y が効く iOS13+ では原則不要だが、旧 iOS の保険として
    // コンテナ内のネイティブピンチを明示的に抑止する（touch 側の処理は維持される）。
    const onGesture = (event) => {
      event.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", onGesture, { passive: false });
    el.addEventListener("gesturechange", onGesture, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", onGesture);
      el.removeEventListener("gesturechange", onGesture);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerRef, applyScaleAtPoint, clampPan, getFitScale, resetZoom, maxScale, beginRasterSession, endRasterSession]);

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
      // ドラッグ中は will-change を維持して再ラスタライズを促す
      beginRasterSession();
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [beginRasterSession, resetZoom]
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

  const onPointerEnd = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.stopPropagation();
      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      // 操作確定: 最終倍率で再ラスタライズしてから will-change を外す
      endRasterSession();
    },
    [endRasterSession]
  );

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
    toggleZoom,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
