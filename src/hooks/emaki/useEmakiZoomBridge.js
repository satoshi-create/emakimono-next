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
  const [zoomCenterIndex, setZoomCenterIndex] = useState(0);
  const [zoomStageMetrics, setZoomStageMetrics] = useState({ height: 0, width: 0 });

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

  // 1. スライス収集（純粋なモデル幅で生成）
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

  // 2. ズーム突入時の中央合わせ
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

  // 3. ズーム突入ハンドラ
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

  // 4. パノラマ連番解決
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

  // 5. ズームからのキャプチャ（方針A: DOM 1点サンプリング方式）
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

    // 2. data-zoom-strip 内で画面中央 (cx, cy) と交差している img を直接サンプリング
    const stripEl = typeof document !== "undefined" ? document.querySelector('[data-zoom-strip="true"]') : null;
    const imgs = stripEl ? Array.from(stripEl.querySelectorAll("img[data-scene-index]")) : [];

    let hitImg = null;
    let hitRect = null;

    if (imgs.length > 0) {
      hitImg = imgs.find((img) => {
        const r = img.getBoundingClientRect();
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      });

      // 境界や余白で交差判定が外れた場合は中央に最も近い画像を採用
      if (!hitImg) {
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
      targetIndex = resolvePanoramaSliceIndex(items, targetIndex);

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
      }
    }

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

  // 6. 通常表示時のポラロイド起動
  const handleOpenPolaroidModal = useCallback(() => {
    const el = articleRef.current;
    const probed = el ? findSceneIndexAtViewportCenter(el) : null;
    const targetIndex =
      probed !== null && !Number.isNaN(probed) ? probed : liveSceneIndex;

    setPolaroidSceneIndex(targetIndex);
    setPolaroidInitialZoom(undefined);
    setPolaroidInitialPan(undefined);
    setCaptureRevision((rev) => rev + 1);
    setIsPolaroidModalOpen(true);
  }, [articleRef, liveSceneIndex]);

  // 7. モーダル閉鎖時のクリーンアップ
  const handleClosePolaroidModal = useCallback(() => {
    setIsPolaroidModalOpen(false);
    setPolaroidInitialZoom(undefined);
    setPolaroidInitialPan(undefined);
  }, []);

  // 8. ズームリセット時の状態初期化
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
