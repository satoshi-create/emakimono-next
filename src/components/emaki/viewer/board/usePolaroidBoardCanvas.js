import { useEffect, useRef, useState } from "react";
import { saveBoardItems } from "./polaroidBoardStorage";
import { updateCollabBoardItem } from "@/libs/api/ugcApi";
import {
  isClientBoardAdmin,
  buildBoardViewportStorageKey,
  loadBoardViewport,
  saveBoardViewport,
} from "./polaroidBoardPolicy";
import { logBoardPersistDebug } from "./usePolaroidBoardSync";

/**
 * ボードキャンバスの Pan / Zoom・自動フィット・カードドラッグ配置を統括するフック
 */
export function usePolaroidBoardCanvas({
  router,
  isCollabMode,
  isSharedMode,
  roomParam,
  personalParam,
  sharedParam,
  boardPerms,
  items,
  setItems,
  bringToFront,
  localMovedCoordsRef: localMovedCoordsRefProp,
  dragStateRef: dragStateRefProp,
  pendingPersistRef: pendingPersistRefProp,
  hasInitialFitRef: hasInitialFitRefProp,
  activeBoardContextRef: activeBoardContextRefProp,
  allowViewportPersistRef: allowViewportPersistRefProp,
  updateCollabRoomItemsCache,
}) {
  // ===========================================================================
  // 1. ビューポート状態・参照Ref（ドラッグ中のローカル座標上書き保護を含む）
  // ===========================================================================
  const [viewport, setViewport] = useState({ x: 340, y: 64, scale: 1 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const [isPanning, setIsPanning] = useState(false);
  const [rasterizeTick, setRasterizeTick] = useState(0);

  const canvasOuterRef = useRef(null);
  const internalHasInitialFitRef = useRef(false);
  const internalActiveBoardContextRef = useRef(null);
  const internalAllowViewportPersistRef = useRef(false);
  const internalPendingPersistRef = useRef({});
  const hasInitialFitRef = hasInitialFitRefProp ?? internalHasInitialFitRef;
  const activeBoardContextRef = activeBoardContextRefProp ?? internalActiveBoardContextRef;
  const allowViewportPersistRef = allowViewportPersistRefProp ?? internalAllowViewportPersistRef;
  const pendingPersistRef = pendingPersistRefProp ?? internalPendingPersistRef;
  const internalLocalMovedCoordsRef = useRef({});
  const localMovedCoordsRef = localMovedCoordsRefProp ?? internalLocalMovedCoordsRef;
  const placeholderAnchorRef = useRef({ boardKey: null, x: 320, y: 140 });

  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const internalDragStateRef = useRef({
    id: null,
    el: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    lastX: 0,
    lastY: 0,
    rafId: null,
  });
  const dragStateRef = dragStateRefProp ?? internalDragStateRef;

  // ズーム変更後の高精細ラスタライズ再描画デバウンス
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRasterizeTick((t) => t + 1);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [viewport.scale]);

  // ===========================================================================
  // 2. 点線プレースホルダー座標解決 ＆ 初期ビューポート自動フィット
  // ===========================================================================
  const resolveFixedPlaceholderPos = (targetItems) => {
    const boardKey = `${isCollabMode ? "pub" : "priv"}:${roomParam || personalParam || "default"}:${
      Array.isArray(targetItems) ? targetItems.length : 0
    }`;
    if (placeholderAnchorRef.current.boardKey === boardKey) {
      return { x: placeholderAnchorRef.current.x, y: placeholderAnchorRef.current.y };
    }
    const x =
      !Array.isArray(targetItems) || targetItems.length === 0
        ? 320
        : targetItems.reduce((m, c) => Math.max(m, Number(c.boardX) || 0), 0) + 270;
    const y =
      !Array.isArray(targetItems) || targetItems.length === 0
        ? 140
        : targetItems.reduce((m, c) => Math.min(m, Number(c.boardY) || 140), 140);
    placeholderAnchorRef.current = { boardKey, x, y };
    return { x, y };
  };

  const fitViewportToItems = (targetItems) => {
    const rect = canvasOuterRef.current?.getBoundingClientRect();
    const viewW = rect?.width || (typeof window !== "undefined" ? window.innerWidth : 1280);
    const viewH = rect?.height || (typeof window !== "undefined" ? window.innerHeight - 120 : 680);

    if (!Array.isArray(targetItems) || targetItems.length === 0) {
      if (isCollabMode) {
        const fixedPh = resolveFixedPlaceholderPos([]);
        // 公開ボード0枚時は点線カード (320, 140, 幅228, 高さ260) を画面中央に配置
        const centerX = Math.round(viewW / 2 - (fixedPh.x + 114));
        const centerY = Math.round(viewH / 2 - (fixedPh.y + 130) + 20);
        setViewport({ x: centerX, y: Math.max(56, centerY), scale: 1 });
      } else {
        setViewport({ x: 340, y: 64, scale: 1 });
      }
      return;
    }
    const cardW = 240;
    const cardH = 310;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const it of targetItems) {
      const x = Number(it.boardX) || 0;
      const y = Number(it.boardY) || 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + cardW > maxX) maxX = x + cardW;
      if (y + cardH > maxY) maxY = y + cardH;
    }

    if (isCollabMode) {
      // 公開ボード時は右隣の点線カードもバウンディングボックスに含める
      const { x: phX, y: phY } = resolveFixedPlaceholderPos(targetItems);
      if (phX < minX) minX = phX;
      if (phY < minY) minY = phY;
      if (phX + 228 > maxX) maxX = phX + 228;
      if (phY + 260 > maxY) maxY = phY + 260;
    }

    const leftSafe = 48;
    const topSafe = 68;
    const pad = 48;
    const contentW = Math.max(cardW, maxX - minX);
    const contentH = Math.max(cardH, maxY - minY);
    const availW = Math.max(300, viewW - leftSafe - pad);
    const availH = Math.max(240, viewH - topSafe - pad);

    const rawScale = Math.min(1, availW / contentW, availH / contentH);
    const scale = Math.round(Math.max(0.45, Math.min(1, rawScale)) * 100) / 100;

    const scaledW = contentW * scale;
    const x =
      scaledW < availW
        ? Math.round(leftSafe + (availW - scaledW) / 2 - minX * scale)
        : Math.round(leftSafe - minX * scale);
    const y = Math.round(topSafe - minY * scale);

    setViewport({ x, y, scale });
  };

  // ===========================================================================
  // 3. ビューポートの sessionStorage 復元・保存
  // ===========================================================================
  const resolveBoardViewportKey = () =>
    buildBoardViewportStorageKey({ roomParam, personalParam, sharedParam });

  const isAnyItemVisibleInViewport = (targetItems, vp) => {
    if (!Array.isArray(targetItems) || targetItems.length === 0) return true;
    const rect = canvasOuterRef.current?.getBoundingClientRect();
    const viewW = rect?.width || (typeof window !== "undefined" ? window.innerWidth : 1280);
    const viewH = rect?.height || (typeof window !== "undefined" ? window.innerHeight - 120 : 680);
    const cardW = 240;
    const cardH = 310;
    return targetItems.some((it) => {
      const sx = (Number(it.boardX) || 0) * vp.scale + vp.x;
      const sy = (Number(it.boardY) || 0) * vp.scale + vp.y;
      return sx + cardW * vp.scale > 0 && sx < viewW && sy + cardH * vp.scale > 0 && sy < viewH;
    });
  };

  const tryRestoreViewportFromSession = (targetItems) => {
    if (typeof window === "undefined") return false;
    if (isCollabMode) return false;
    const saved = loadBoardViewport(resolveBoardViewportKey());
    if (!saved) return false;
    if (!isAnyItemVisibleInViewport(targetItems, saved)) {
      return false;
    }
    setViewport(saved);
    return true;
  };

  const applyInitialViewportForItemsCore = (targetItems, { forceFit = false } = {}) => {
    const wantPinnedFit = router.query?.pinned === "1";
    if (forceFit || wantPinnedFit) {
      hasInitialFitRef.current = true;
      fitViewportToItems(targetItems);
      allowViewportPersistRef.current = true;
      if (wantPinnedFit) {
        const nextQuery = { ...router.query };
        delete nextQuery.pinned;
        router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
          shallow: true,
        });
      }
      return;
    }
    if (tryRestoreViewportFromSession(targetItems)) {
      hasInitialFitRef.current = true;
      allowViewportPersistRef.current = true;
      return;
    }
    if (!hasInitialFitRef.current) {
      hasInitialFitRef.current = true;
      fitViewportToItems(targetItems);
    }
    allowViewportPersistRef.current = true;
  };

  const applyInitialViewportForItems = (targetItems, options = {}) => {
    if (options.forceFit && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          applyInitialViewportForItemsCore(targetItems, options);
        });
      });
      return;
    }
    applyInitialViewportForItemsCore(targetItems, options);
  };

  const prevBoardRouteRef = useRef(
    `${roomParam || ""}|${personalParam || ""}|${sharedParam || ""}`
  );
  useEffect(() => {
    const routeKey = `${roomParam || ""}|${personalParam || ""}|${sharedParam || ""}`;
    if (prevBoardRouteRef.current !== routeKey) {
      prevBoardRouteRef.current = routeKey;
      setViewport({ x: 340, y: 64, scale: 1 });
    }
  }, [roomParam, personalParam, sharedParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!allowViewportPersistRef.current) return;
    saveBoardViewport(resolveBoardViewportKey(), viewport);
  }, [viewport, roomParam, personalParam, sharedParam]);

  // ===========================================================================
  // 4. キャンバス全体のパン（ドラッグ移動） ＆ ホイール／ボタンズーム
  // ===========================================================================
  const handleCanvasPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (e.target instanceof Element && e.target.closest("a, button, input, textarea, select")) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: viewport.x,
      origY: viewport.y,
    };
  };

  const handleCanvasPointerMove = (e) => {
    const pst = panStateRef.current;
    if (!pst.active) return;
    const dx = e.clientX - pst.startX;
    const dy = e.clientY - pst.startY;
    setViewport((prev) => ({
      ...prev,
      x: pst.origX + dx,
      y: pst.origY + dy,
    }));
  };

  const handleCanvasPointerUp = (e) => {
    if (!panStateRef.current.active) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    panStateRef.current.active = false;
    setIsPanning(false);
  };

  const applyZoomAtPoint = (nextScaleRaw, clientX, clientY) => {
    const nextScale = Math.min(2.5, Math.max(0.35, Number(nextScaleRaw.toFixed(3))));
    const rect = canvasOuterRef.current?.getBoundingClientRect();
    if (!rect) {
      setViewport((prev) => ({ ...prev, scale: nextScale }));
      return;
    }
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    setViewport((prev) => {
      const ratio = nextScale / prev.scale;
      return {
        x: localX - (localX - prev.x) * ratio,
        y: localY - (localY - prev.y) * ratio,
        scale: nextScale,
      };
    });
  };

  useEffect(() => {
    const el = canvasOuterRef.current;
    if (!el) return;

    let rafId = null;
    let pendingFactor = 1;
    let lastClientX = 0;
    let lastClientY = 0;

    const flushWheelZoom = () => {
      rafId = null;
      const factor = pendingFactor;
      pendingFactor = 1;
      if (factor === 1) return;
      const rect = el.getBoundingClientRect();
      setViewport((prev) => {
        const nextScale = Math.min(2.5, Math.max(0.35, Number((prev.scale * factor).toFixed(3))));
        if (nextScale === prev.scale) return prev;
        if (!rect) {
          return { ...prev, scale: nextScale };
        }
        const localX = lastClientX - rect.left;
        const localY = lastClientY - rect.top;
        const ratio = nextScale / prev.scale;
        return {
          x: localX - (localX - prev.x) * ratio,
          y: localY - (localY - prev.y) * ratio,
          scale: nextScale,
        };
      });
    };

    const onWheelNative = (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
      const clampedDelta = Math.max(-120, Math.min(120, e.deltaY));
      const stepFactor = Math.exp(-clampedDelta * 0.0014);
      pendingFactor *= stepFactor;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(flushWheelZoom);
      }
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handleZoomStep = (delta) => {
    const rect = canvasOuterRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;
    applyZoomAtPoint(viewport.scale + delta, cx, cy);
  };

  const handleZoomReset = () => {
    fitViewportToItems(items);
  };

  const [dragLivePosition, setDragLivePosition] = useState(null);

  const readBoardXYFromElement = (el, fallbackX, fallbackY) => {
    if (!el || typeof window === "undefined") {
      return { x: fallbackX, y: fallbackY };
    }
    const raw = window.getComputedStyle(el).transform;
    if (!raw || raw === "none") return { x: fallbackX, y: fallbackY };
    const match2d = raw.match(/^matrix\(([^)]+)\)$/);
    if (match2d) {
      const parts = match2d[1].split(",").map((s) => parseFloat(s.trim()));
      if (parts.length >= 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
        return { x: Math.round(parts[4]), y: Math.round(parts[5]) };
      }
    }
    const match3d = raw.match(/^matrix3d\(([^)]+)\)$/);
    if (match3d) {
      const parts = match3d[1].split(",").map((s) => parseFloat(s.trim()));
      if (parts.length >= 14 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
        return { x: Math.round(parts[12]), y: Math.round(parts[13]) };
      }
    }
    return { x: fallbackX, y: fallbackY };
  };

  const clampBoardCoord = (v) => Math.max(-50000, Math.min(50000, Math.round(v)));

  // ===========================================================================
  // 5. 個別カードのドラッグ移動（dragLivePosition のみ描画・PointerUp で永続化）
  // ===========================================================================
  const handleCardPointerDown = (e, item) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON" || e.target.tagName === "A") {
      return;
    }
    panStateRef.current.active = false;
    setIsPanning(false);

    const cardEl = e.currentTarget;
    cardEl.setPointerCapture?.(e.pointerId);
    const fallbackX = Number(item.boardX) || 0;
    const fallbackY = Number(item.boardY) || 0;
    const { x: origX, y: origY } = readBoardXYFromElement(cardEl, fallbackX, fallbackY);
    const rotate = Number(item.rotate) || 0;
    dragStateRef.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
      rotate,
      lastX: origX,
      lastY: origY,
      rafId: null,
    };
    setDragLivePosition({ id: item.id, boardX: origX, boardY: origY, rotate });
  };

  const handleCardPointerMove = (e) => {
    const st = dragStateRef.current;
    if (!st.id) return;
    e.stopPropagation();
    const currentScale = viewportRef.current?.scale || 1;
    const dx = (e.clientX - st.startX) / currentScale;
    const dy = (e.clientY - st.startY) / currentScale;
    st.lastX = clampBoardCoord(st.origX + dx);
    st.lastY = clampBoardCoord(st.origY + dy);
    if (st.rafId === null) {
      st.rafId = window.requestAnimationFrame(() => {
        st.rafId = null;
        const activeDrag = dragStateRef.current;
        if (!activeDrag.id) return;
        setDragLivePosition({
          id: activeDrag.id,
          boardX: activeDrag.lastX,
          boardY: activeDrag.lastY,
          rotate: activeDrag.rotate,
        });
      });
    }
  };

  const handleCardPointerUp = (e) => {
    const st = dragStateRef.current;
    if (!st.id) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    if (st.rafId !== null) {
      window.cancelAnimationFrame(st.rafId);
    }
    const movedId = st.id;
    const finalX = clampBoardCoord(st.lastX);
    const finalY = clampBoardCoord(st.lastY);
    dragStateRef.current = {
      id: null,
      startX: 0,
      startY: 0,
      origX: 0,
      origY: 0,
      lastX: 0,
      lastY: 0,
      rafId: null,
    };
    setDragLivePosition(null);
    const shouldTrackLocal =
      isCollabMode || (!boardPerms.persistToLocalStorage && !isSharedMode);
    if (shouldTrackLocal) {
      const prevOv = localMovedCoordsRef.current[movedId] || {};
      localMovedCoordsRef.current[movedId] = {
        boardX: finalX,
        boardY: finalY,
        ...(typeof prevOv.zIndex === "number" ? { zIndex: prevOv.zIndex } : {}),
      };
    }
    setItems((prev) => {
      const next = prev.map((it) =>
        it.id === movedId ? { ...it, boardX: finalX, boardY: finalY } : it
      );
      if (boardPerms.persistToLocalStorage && !isCollabMode && !isSharedMode) {
        saveBoardItems(next, personalParam || "default");
      }
      if (isCollabMode && roomParam && typeof updateCollabRoomItemsCache === "function") {
        updateCollabRoomItemsCache(roomParam, next);
      }
      return next;
    });
    bringToFront(movedId);
    const isAdmin = isClientBoardAdmin();
    logBoardPersistDebug("POINTER_UP", {
      movedId,
      finalX,
      finalY,
      isCollabMode,
      isSharedMode,
      roomParam,
      personalParam,
      persistToLocalStorage: boardPerms.persistToLocalStorage,
      isAdmin,
    });
    if (isCollabMode && roomParam) {
      pendingPersistRef.current[movedId] = {
        boardX: finalX,
        boardY: finalY,
        ts: Date.now(),
      };
      updateCollabBoardItem(roomParam, {
        itemId: movedId,
        boardX: finalX,
        boardY: finalY,
      })
        .then((res) => {
          logBoardPersistDebug("PATCH_OK", { movedId, finalX, finalY, res });
          const updated = res?.updated;
          if (
            updated &&
            (updated.boardX !== finalX || updated.boardY !== finalY)
          ) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === movedId
                  ? {
                      ...it,
                      boardX: updated.boardX ?? it.boardX,
                      boardY: updated.boardY ?? it.boardY,
                    }
                  : it
              )
            );
          }
          window.setTimeout(() => {
            delete pendingPersistRef.current[movedId];
          }, 2500);
        })
        .catch((err) => {
          console.warn("[PolaroidBoardView] Failed to persist card position:", err);
          window.setTimeout(() => {
            delete pendingPersistRef.current[movedId];
          }, 5000);
        });
    }
  };

  return {
    viewport,
    isPanning,
    rasterizeTick,
    canvasOuterRef,
    hasInitialFitRef,
    activeBoardContextRef,
    allowViewportPersistRef,
    localMovedCoordsRef,
    dragStateRef,
    resolveFixedPlaceholderPos,
    applyInitialViewportForItems,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleZoomStep,
    handleZoomReset,
    handleCardPointerDown,
    handleCardPointerMove,
    handleCardPointerUp,
    dragLivePosition,
  };
}