import { useState, useMemo, useCallback, useRef } from "react";
import {
  computeZoomStripRange,
  sceneIndexAtContentX,
  sceneWidthPx,
} from "@/utils/emakiContentWindow";
import {
  PHOTO_DW,
  PHOTO_DH,
  ZOOM_MIN,
  ZOOM_MAX,
} from "@/components/emaki/viewer/polaroid/polaroidCanvasRenderer";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { isByobuScroll } from "@/utils/isByobuScroll";
import {
  ZOOM_STRIP_MIN_SLICES,
  ZOOM_STRIP_MIN_SLICES_BYOBU,
} from "@/libs/constants/viewerPlayback";
import { findSceneIndexAtViewportCenter } from "@/utils/emakiSceneDom";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_BRIDGE = false;

function logBridge(tag, ...args) {
  if (!DEBUG_BRIDGE) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][Bridge:${tag}]`, "color: #10b981; font-weight: bold;", ...args);
}

export default function useEmakiZoomBridge({
  data,
  processedEmakis,
  articleRef,
  entryContainerRef,
  contentWindowCenterRef,
  liveSceneIndex,
  isZoomed,
  zoomScale,
  panX,
  panY,
  openZoom,
  resetZoom: originalResetZoom,
  toggleZoom: originalToggleZoom,
  enterZoomRef,
  onZoomOpenTrack,
  onZoomCloseTrack,
}) {
  // ---------------------------------------------------------------------------
  // 1. 状態管理（State）
  // ---------------------------------------------------------------------------
  const [zoomCenterIndex, setZoomCenterIndex] = useState(0);
  const [zoomStageMetrics, setZoomStageMetrics] = useState({ height: 0, width: 0 });

  // ポラロイドモーダル（子コンポーネント）へ渡す Props の大元ステート
  const [isPolaroidModalOpen, setIsPolaroidModalOpen] = useState(false);
  const [polaroidSceneIndex, setPolaroidSceneIndex] = useState(0);
  const [polaroidInitialZoom, setPolaroidInitialZoom] = useState(undefined);
  const [polaroidInitialPan, setPolaroidInitialPan] = useState(undefined);
  const [captureRevision, setCaptureRevision] = useState(0);

  const zoomMinSlices = isByobuScroll(data)
    ? ZOOM_STRIP_MIN_SLICES_BYOBU
    : ZOOM_STRIP_MIN_SLICES;

  const getArticleUnitHeight = useCallback(
    (el) => (el ? el.offsetHeight || el.clientHeight || 0 : 0),
    []
  );

  // ---------------------------------------------------------------------------
  // [フロー 1] ズームストリップ用のスライス抽出
  // centerIndex を中心に、前後の必要なスライス範囲（from 〜 to）を特定
  // ---------------------------------------------------------------------------
  const collectZoomSlices = useCallback(
    (centerIndex, metrics = {}) => {
      const items = processedEmakis;
      if (!items?.length) return [];
      const el = articleRef.current;
      const heightEl = entryContainerRef.current;
      let rowHeightPx =
        metrics.height || heightEl?.clientHeight || el?.clientHeight || 0;
      if (!(rowHeightPx > 0) && typeof window !== "undefined") {
        rowHeightPx = window.innerHeight || 0;
      }
      if (!(rowHeightPx > 0)) return [];
      const stageWidthPx = metrics.width || el?.clientWidth || 0;
      const { from, to } = computeZoomStripRange(
        items,
        centerIndex,
        rowHeightPx,
        stageWidthPx,
        zoomMinSlices
      );
      const list = [];
      for (let i = from; i <= to; i += 1) {
        const item = items[i];
        if (!item?.src) continue;
        list.push({
          key: i,
          src: buildCloudinaryUrl(item.src, [
            "c_limit",
            `w_${Math.max(2000, Math.round(item.srcWidth || 0))}`,
            "e_sharpen:80",
            "f_auto",
            "q_auto:best",
          ]),
          srcWidth: item.srcWidth || 0,
          srcHeight: item.srcHeight || 0,
        });
      }
      return list;
    },
    [processedEmakis, zoomMinSlices, articleRef, entryContainerRef]
  );

  const zoomSlices = useMemo(
    () => collectZoomSlices(zoomCenterIndex, zoomStageMetrics),
    [collectZoomSlices, zoomCenterIndex, zoomStageMetrics]
  );

  // ---------------------------------------------------------------------------
  // [フロー 2] ズーム突入時の中央合わせ（PanX 計算）
  // ---------------------------------------------------------------------------
  const computeZoomAlignPanX = useCallback(
    (centerIndex, rowHeightPx) => {
      const el = articleRef.current;
      const items = processedEmakis;
      if (!el || !items?.length || !(rowHeightPx > 0)) return 0;
      const { from, to } = computeZoomStripRange(
        items,
        centerIndex,
        rowHeightPx,
        el.clientWidth,
        zoomMinSlices
      );
      let offsetFrom = 0;
      for (let i = 0; i < from; i += 1) {
        offsetFrom += sceneWidthPx(items[i], rowHeightPx);
      }
      let stripWidth = 0;
      for (let i = from; i <= to; i += 1) {
        stripWidth += sceneWidthPx(items[i], rowHeightPx);
      }
      const articleUnit = getArticleUnitHeight(el);
      const k = articleUnit > 0 ? rowHeightPx / articleUnit : 1;
      const viewportCenterFromStart =
        (Math.abs(el.scrollLeft) + el.clientWidth / 2) * k;
      return viewportCenterFromStart - offsetFrom - stripWidth / 2;
    },
    [processedEmakis, zoomMinSlices, getArticleUnitHeight, articleRef]
  );

  // ---------------------------------------------------------------------------
  // [フロー 3] ズーム突入ハンドラ
  // ---------------------------------------------------------------------------
  const enterZoomAtPoint = useCallback(
    (clientX, clientY, initialScale) => {
      const el = articleRef.current;
      const containerHeight =
        entryContainerRef.current?.clientHeight || el?.clientHeight || 0;
      let centerIndex = Number.isFinite(contentWindowCenterRef?.current)
        ? contentWindowCenterRef.current
        : zoomCenterIndex;

      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        const rect = el.getBoundingClientRect();
        const focusX = Number.isFinite(clientX)
          ? clientX
          : rect.left + rect.width / 2;
        const contentX = Math.abs(el.scrollLeft) + (rect.right - focusX);
        const estimated = sceneIndexAtContentX(
          data.emakis,
          contentX,
          getArticleUnitHeight(el) || containerHeight
        );
        if (Number.isFinite(estimated)) centerIndex = estimated;
      }

      const measuredHeight = containerHeight;
      const measuredWidth = el?.clientWidth || 0;
      if (measuredHeight > 0 || measuredWidth > 0) {
        setZoomStageMetrics({ height: measuredHeight, width: measuredWidth });
      }
      setZoomCenterIndex(centerIndex);
      const initialPanX = computeZoomAlignPanX(centerIndex, measuredHeight);
      openZoom(clientX, clientY, initialPanX, initialScale);
    },
    [
      data.emakis,
      zoomCenterIndex,
      computeZoomAlignPanX,
      getArticleUnitHeight,
      contentWindowCenterRef,
      openZoom,
      articleRef,
      entryContainerRef,
    ]
  );

  if (enterZoomRef) {
    enterZoomRef.current = enterZoomAtPoint;
  }

  // ---------------------------------------------------------------------------
  // [フロー 4] パノラマ連番解決
  // 詞書（ekotoba）を除外し、有効な画像スライス番号を探す
  // ---------------------------------------------------------------------------
  const resolvePanoramaSliceIndex = (items, idx) => {
    const isPanoramaSlice = (item) => Boolean(item?.src) && item?.cat !== "ekotoba";
    for (let i = idx; i >= 0; i -= 1) {
      if (isPanoramaSlice(items[i])) return i;
    }
    for (let i = idx + 1; i < items.length; i += 1) {
      if (isPanoramaSlice(items[i])) return i;
    }
    return idx;
  };

  // ---------------------------------------------------------------------------
  // [フロー 5] ズーム中からのポラロイド撮影（DOM 1点サンプリング方式）
  // ズームレイヤー上の画面中央 (cx, cy) にある img を物理座標でサンプリング
  // ---------------------------------------------------------------------------
  const handleCaptureFromZoom = useCallback(() => {
    const items = processedEmakis || [];
    const currentScale = Number.isFinite(zoomScale) && zoomScale > 0 ? zoomScale : 1;
    const clampedZoom = Math.min(Math.max(currentScale, ZOOM_MIN), ZOOM_MAX);

    let targetIndex = zoomCenterIndex ?? liveSceneIndex;
    let initialPan = { x: 0, y: 0 };

    // 1. 絵巻コンテナ（ステージ）の中央座標 (cx, cy) を取得
    const stageEl = entryContainerRef.current || articleRef.current;
    const stageRect = stageEl ? stageEl.getBoundingClientRect() : {
      left: 0,
      top: 0,
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    };
    const cx = stageRect.left + stageRect.width / 2;
    const cy = stageRect.top + stageRect.height / 2;

    logBridge("CaptureFromZoom:StageCenter", {
      cx: cx.toFixed(1),
      cy: cy.toFixed(1),
      stageRect: { left: stageRect.left.toFixed(1), width: stageRect.width.toFixed(1) },
    });

    // 2. data-zoom-strip 内で画面中央 (cx, cy) と交差している img を直接サンプリング
    const stripEl = typeof document !== "undefined" ? document.querySelector('[data-zoom-strip="true"]') : null;
    const imgs = stripEl ? Array.from(stripEl.querySelectorAll("img[data-scene-index]")) : [];

    logBridge("CaptureFromZoom:StripFound", {
      hasStripEl: Boolean(stripEl),
      imgCount: imgs.length,
      sceneIndices: imgs.map((img) => img.dataset.sceneIndex),
    });

    let hitImg = null;
    let hitRect = null;

    if (imgs.length > 0) {
      hitImg = imgs.find((img) => {
        const r = img.getBoundingClientRect();
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      });

      // 境界や余白で交差判定が外れた場合は中央に最も近い画像を採用
      if (!hitImg) {
        logBridge("CaptureFromZoom:ExactHitFailed", "中央最近接の画像を探索します");
        let minDistance = Infinity;
        imgs.forEach((img) => {
          const r = img.getBoundingClientRect();
          const imgCenterX = r.left + r.width / 2;
          const dist = Math.abs(cx - imgCenterX);
          if (dist < minDistance) {
            minDistance = dist;
            hitImg = img;
          }
        });
      }
    }

    if (hitImg) {
      hitRect = hitImg.getBoundingClientRect();
      const rawIdx = Number(hitImg.dataset.sceneIndex);
      if (!Number.isNaN(rawIdx) && rawIdx >= 0 && rawIdx < items.length) {
        targetIndex = rawIdx;
      }
      const resolvedIdx = resolvePanoramaSliceIndex(items, targetIndex);

      logBridge("CaptureFromZoom:HitResult", {
        rawIdx,
        resolvedIdx,
        hitRect: { left: hitRect.left.toFixed(1), right: hitRect.right.toFixed(1), width: hitRect.width.toFixed(1) },
      });

      targetIndex = resolvedIdx;

      const targetItem = items[targetIndex];
      if (targetItem && hitRect.width > 0 && hitRect.height > 0) {
        // 画像内の正規化座標 (u, v) を物理ピクセルから直接算出
        const u = Math.min(Math.max((cx - hitRect.left) / hitRect.width, 0), 1);
        const v = Math.min(Math.max((cy - hitRect.top) / hitRect.height, 0), 1);

        const iw = hitImg.naturalWidth || targetItem.srcWidth || hitRect.width;
        const ih = hitImg.naturalHeight || targetItem.srcHeight || hitRect.height;
        const cs = Math.max(PHOTO_DW / iw, PHOTO_DH / ih);
        const renderedSliceW = iw * cs * clampedZoom;
        const renderedSliceH = ih * cs * clampedZoom;

        initialPan = {
          x: (0.5 - u) * renderedSliceW,
          y: (0.5 - v) * renderedSliceH,
        };

        logBridge("CaptureFromZoom:CalculatedPan", {
          u: u.toFixed(3),
          v: v.toFixed(3),
          renderedSliceW: renderedSliceW.toFixed(1),
          initialPan,
        });
      }
    } else {
      logBridge("CaptureFromZoom:NoHitWarning", "サンプリング画像が見つからず、デフォルト index を採用", {
        fallbackTargetIndex: targetIndex,
      });
    }

    logBridge("CaptureFromZoom:FinalPropsEmitted", {
      polaroidSceneIndex: targetIndex,
      polaroidInitialZoom: clampedZoom,
      polaroidInitialPan: initialPan,
    });

    setPolaroidSceneIndex(targetIndex);
    setPolaroidInitialZoom(clampedZoom);
    setPolaroidInitialPan(initialPan);
    setCaptureRevision((rev) => rev + 1);
    setIsPolaroidModalOpen(true);
  }, [
    processedEmakis,
    zoomScale,
    zoomCenterIndex,
    liveSceneIndex,
    articleRef,
    entryContainerRef,
    captureRevision,
  ]);

  // ---------------------------------------------------------------------------
  // [フロー 6] 通常表示時（非ズーム時）のポラロイド起動
  // ★バグ1（コンテナ外の画像が出る）の最重要容疑ルート★
  // ---------------------------------------------------------------------------
  
  // const handleOpenPolaroidModal = useCallback(() => {
  //   const el = articleRef.current;
    
  //   // findSceneIndexAtViewportCenter で現在の横スクロール位置から中央スライスを算出
  //   const probed = el ? findSceneIndexAtViewportCenter(el) : null;
  //   const targetIndex =
  //     probed !== null && !Number.isNaN(probed) ? probed : liveSceneIndex;

  //   logBridge("NormalOpen:Triggered", {
  //     scrollLeft: el?.scrollLeft,
  //     clientWidth: el?.clientWidth,
  //     probedCenterIndex: probed,
  //     liveSceneIndexFallback: liveSceneIndex,
  //     finalTargetIndex: targetIndex,
  //   });

  //   setPolaroidSceneIndex(targetIndex);
  //   setPolaroidInitialZoom(undefined);
  //   setPolaroidInitialPan(undefined);
  //   setCaptureRevision((rev) => rev + 1);
  //   setIsPolaroidModalOpen(true);
  // }, [articleRef, liveSceneIndex]);


  const handleOpenPolaroidModal = useCallback(() => {
    const el = articleRef.current;
    const items = processedEmakis || [];
    
    // findSceneIndexAtViewportCenter で現在の横スクロール位置から中央スライスを算出
    const probed = el ? findSceneIndexAtViewportCenter(el) : null;
    const targetIndex =
      probed !== null && !Number.isNaN(probed) ? probed : liveSceneIndex;

    let initialPan = { x: 0, y: 0 };
    const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

    // 画面中央と交差している section 内の img を取得してオフセット (u, v) を計算
    const targetSection = el ? el.querySelector(`section#scene-${targetIndex}`) : null;
    const hitImg = targetSection ? targetSection.querySelector("img") : null;

    if (hitImg) {
      const hitRect = hitImg.getBoundingClientRect();
      const targetItem = items[targetIndex];

      if (hitRect.width > 0 && hitRect.height > 0) {
        const u = Math.min(Math.max((cx - hitRect.left) / hitRect.width, 0), 1);
        const v = Math.min(Math.max((cy - hitRect.top) / hitRect.height, 0), 1);

        const iw = hitImg.naturalWidth || targetItem?.srcWidth || hitRect.width;
        const ih = hitImg.naturalHeight || targetItem?.srcHeight || hitRect.height;
        // ポラロイド内の初期ズーム（ZOOM_DEFAULT = 1.5 等）に合わせた展開幅を計算
        const cs = Math.max(PHOTO_DW / iw, PHOTO_DH / ih);
        const openZoom = 1.5; // polaroidCanvasRenderer の ZOOM_DEFAULT
        const renderedSliceW = iw * cs * openZoom;
        const renderedSliceH = ih * cs * openZoom;

        initialPan = {
          x: (0.5 - u) * renderedSliceW,
          y: (0.5 - v) * renderedSliceH,
        };
      }
    }

    logBridge("NormalOpen:Triggered", {
      scrollLeft: el?.scrollLeft,
      clientWidth: el?.clientWidth,
      probedCenterIndex: probed,
      liveSceneIndexFallback: liveSceneIndex,
      finalTargetIndex: targetIndex,
      calculatedInitialPan: initialPan,
    });

    setPolaroidSceneIndex(targetIndex);
    setPolaroidInitialZoom(undefined);
    setPolaroidInitialPan(initialPan);
    setCaptureRevision((rev) => rev + 1);
    setIsPolaroidModalOpen(true);
  }, [articleRef, liveSceneIndex, processedEmakis]);

  // ---------------------------------------------------------------------------
  // [フロー 7] モーダル閉鎖時のクリーンアップ
  // ---------------------------------------------------------------------------
  const handleClosePolaroidModal = useCallback(() => {
    logBridge("ModalClosed");
    setIsPolaroidModalOpen(false);
    setPolaroidInitialZoom(undefined);
    setPolaroidInitialPan(undefined);
  }, []);

  // ---------------------------------------------------------------------------
  // [フロー 8] ズームリセット時の状態初期化
  // ---------------------------------------------------------------------------
  const resetZoom = useCallback(() => {
    if (onZoomCloseTrack) onZoomCloseTrack();
    setZoomCenterIndex(0);
    setZoomStageMetrics({ height: 0, width: 0 });
    originalResetZoom();
  }, [onZoomCloseTrack, originalResetZoom]);

  const toggleZoom = useCallback(
    (e) => {
      if (!isZoomed) {
        if (onZoomOpenTrack) onZoomOpenTrack("button");
      } else {
        if (onZoomCloseTrack) onZoomCloseTrack();
      }
      originalToggleZoom(e);
    },
    [isZoomed, onZoomOpenTrack, onZoomCloseTrack, originalToggleZoom]
  );

  return {
    zoomSlices,
    zoomCenterIndex,
    enterZoomAtPoint,
    handleCaptureFromZoom,
    handleOpenPolaroidModal,
    handleClosePolaroidModal,
    resetZoom,
    toggleZoom,
    isPolaroidModalOpen,
    polaroidSceneIndex,
    polaroidInitialZoom,
    polaroidInitialPan,
    polaroidModalKey: `${polaroidSceneIndex}-${captureRevision}`,
  };
}