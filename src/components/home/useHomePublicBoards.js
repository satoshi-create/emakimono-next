import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCollabBoard, fetchPublicBoards } from "@/libs/api/ugcApi";
import { getAllHubPages } from "@/libs/hubPages";
import { PHOTO_DW, PHOTO_DH } from "@/components/emaki/viewer/polaroid/polaroidCanvasRenderer";

// =============================================================================
// 1. カード寸法定数 ＆ デバッグスイッチ
// =============================================================================
export const HOME_CARD_PHOTO_W = 204;
export const HOME_CARD_PHOTO_H = Math.round((HOME_CARD_PHOTO_W * PHOTO_DH) / PHOTO_DW);
export const HOME_CARD_OUTER_W = HOME_CARD_PHOTO_W + 22;
export const HOME_CARD_OUTER_H = HOME_CARD_PHOTO_H + 108;

const HUBS_INLINE_RE = /\n?<!--hubs:([^>]*)-->/;
const DEBUG_HOME_BOARD_DRAG = false;

function logBoardDebug(tag, ...args) {
  if (!DEBUG_HOME_BOARD_DRAG) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

// =============================================================================
// 2. Pure Logic（ハブスラッグ抽出・初期座標正規化・点線カード配置・自動フィット計算）
// =============================================================================
export function extractHubSlugsFromDescription(description) {
  const raw = typeof description === "string" ? description : "";
  const match = raw.match(HUBS_INLINE_RE);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 初期座標が未設定または重なっている場合に整列するフォールバック
export function normalizeBoardItems(rawItems) {
  return rawItems.map((item, idx) => {
    const bx = Number(item.boardX);
    const by = Number(item.boardY);
    const hasCoords =
      Number.isFinite(bx) && Number.isFinite(by) && (bx !== 0 || by !== 0);
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    return {
      ...item,
      boardX: hasCoords ? bx : 40 + col * 255,
      boardY: hasCoords ? by : 40 + row * 285,
      rotate:
        typeof item.rotate === "number"
          ? item.rotate
          : idx % 2 === 0
          ? -1.8
          : 1.8,
      zIndex: item.zIndex || idx + 1,
    };
  });
}

// 点線ダミーカード（「＋ あなたの1枚を貼る」）の配置座標を算出
export function getAddPlaceholderPos(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { x: 120, y: 40 };
  }
  let maxRight = -Infinity;
  let refY = 40;
  for (const item of items) {
    const x = Number(item.boardX) || 0;
    const y = Number(item.boardY) || 0;
    if (x + HOME_CARD_OUTER_W > maxRight) {
      maxRight = x + HOME_CARD_OUTER_W;
      refY = y;
    }
  }
  return { x: maxRight + 34, y: refY };
}

// カード群（点線プレースホルダー含む）が上部フローティングUIや左端に見切れずボード内に収まるビューポートを計算
export function computeFittedViewport(items, containerW = 1280, containerH = 580) {
  const placeholderPos = getAddPlaceholderPos(items);
  const targets = [
    ...(Array.isArray(items) ? items : []),
    { boardX: placeholderPos.x, boardY: placeholderPos.y },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of targets) {
    const x = Number(item.boardX) || 0;
    const y = Number(item.boardY) || 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + HOME_CARD_OUTER_W > maxX) maxX = x + HOME_CARD_OUTER_W;
    if (y + HOME_CARD_OUTER_H > maxY) maxY = y + HOME_CARD_OUTER_H;
  }

  const padLeft = 40;
  const padRight = 40;
  const padTop = 114; // 上部コピー＆タブバーの高さ分の安全余白
  const padBottom = 56; // 下部コントロールバー分の安全余白

  const contentW = Math.max(HOME_CARD_OUTER_W, maxX - minX);
  const contentH = Math.max(HOME_CARD_OUTER_H, maxY - minY);
  const availW = Math.max(320, containerW - padLeft - padRight);
  const availH = Math.max(240, containerH - padTop - padBottom);

  const scale = 1;

  const scaledW = contentW * scale;
  const offsetX =
    scaledW < availW
      ? padLeft + (availW - scaledW) / 2 - minX * scale
      : padLeft - minX * scale;
  const offsetY = padTop - minY * scale;

  return {
    x: Math.round(offsetX),
    y: Math.round(offsetY),
    scale,
  };
}

// =============================================================================
// 3. トップページ公開ボードの状態・通信・Pan/Zoom・カードドラッグフック
// =============================================================================
export function useHomePublicBoards({ router, isEn }) {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [itemsByBoardId, setItemsByBoardId] = useState({});
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [viewport, setViewport] = useState({ x: 48, y: 118, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [likedIds, setLikedIds] = useState({});
  const [showHowTo, setShowHowTo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const boardsRef = useRef(boards);
  boardsRef.current = boards;
  const itemsByBoardIdRef = useRef(itemsByBoardId);
  itemsByBoardIdRef.current = itemsByBoardId;

  const panRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const dragRef = useRef({
    active: false,
    cardId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const applyFitForItems = useCallback((items, reason = "unknown") => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = rect?.width || (typeof window !== "undefined" ? window.innerWidth : 1280);
    const h = rect?.height || 580;
    const nextVp = computeFittedViewport(items, w, h);
    logBoardDebug("APPLY_FIT", { reason, prevScale: viewportRef.current.scale, nextVp });
    setViewport(nextVp);
  }, []);

  // 全画面モード時のスクロールロック・ESC解除・再フィット
  useEffect(() => {
    if (!isFullscreen) return;
    logBoardDebug("FULLSCREEN_EFFECT_RUN", { selectedBoardId });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const rafId = window.requestAnimationFrame(() => {
      const list = boardsRef.current;
      const current = list.find((b) => b.id === selectedBoardId) || list[0];
      const currentItems = current ? itemsByBoardIdRef.current[current.id] || [] : [];
      applyFitForItems(currentItems, "fullscreen-effect");
    });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(rafId);
    };
  }, [isFullscreen, selectedBoardId, applyFitForItems]);

  // 公開ボード一覧の取得と初期タブ選択
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchPublicBoards();
        const list = Array.isArray(res?.boards) ? res.boards.slice(0, 6) : [];
        if (!active) return;
        setBoards(list);

        const initial =
          list.find((b) => (b.itemCount || 0) > 0) || list[0] || null;
        if (initial?.id) {
          setSelectedBoardId(initial.id);
        }
      } catch {
        // 取得失敗時はフォールバックUIを表示
      } finally {
        if (active) setIsLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 選択されたタブのボード詳細（カード一覧）を取得・キャッシュ・自動フィット（ボード切替時のみ）
  const fittedBoardIdRef = useRef(null);

  useEffect(() => {
    if (!selectedBoardId) return;
    if (Object.prototype.hasOwnProperty.call(itemsByBoardId, selectedBoardId)) {
      if (fittedBoardIdRef.current !== selectedBoardId) {
        fittedBoardIdRef.current = selectedBoardId;
        applyFitForItems(itemsByBoardId[selectedBoardId]);
      }
      return;
    }

    let active = true;
    setIsLoadingItems(true);
    (async () => {
      try {
        const detail = await fetchCollabBoard(selectedBoardId);
        if (!active) return;
        const raw = Array.isArray(detail?.items) ? detail.items.slice(0, 16) : [];
        const normalized = normalizeBoardItems(raw);
        setItemsByBoardId((prev) => ({
          ...prev,
          [selectedBoardId]: normalized,
        }));
        fittedBoardIdRef.current = selectedBoardId;
        applyFitForItems(normalized);
      } catch {
        if (!active) return;
        setItemsByBoardId((prev) => ({
          ...prev,
          [selectedBoardId]: [],
        }));
      } finally {
        if (active) setIsLoadingItems(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedBoardId, itemsByBoardId, applyFitForItems]);

  // キャンバス上のマウスホイールでカーソル中心に拡大・縮小
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const cur = viewportRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextScale =
        Math.round(Math.min(1.8, Math.max(0.45, cur.scale * factor)) * 100) /
        100;
      if (nextScale === cur.scale) return;

      const worldX = (cursorX - cur.x) / cur.scale;
      const worldY = (cursorY - cur.y) / cur.scale;
      const nextX = Math.round(cursorX - worldX * nextScale);
      const nextY = Math.round(cursorY - worldY * nextScale);

      setViewport({ x: nextX, y: nextY, scale: nextScale });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const activeBoard =
    boards.find((b) => b.id === selectedBoardId) || boards[0] || null;
  const activeItems = activeBoard ? itemsByBoardId[activeBoard.id] || [] : [];

  const relatedHubs = useMemo(() => {
    const slugs = extractHubSlugsFromDescription(activeBoard?.description);
    if (!slugs.length) return [];
    const bySlug = new Map(getAllHubPages().map((h) => [h.slug, h]));
    return slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
  }, [activeBoard?.description]);

  const handleSelectTab = (boardId) => {
    setSelectedBoardId(boardId);
    setActiveCardId(null);
  };

  const primaryTargetHub = relatedHubs.length > 0 ? relatedHubs[0] : null;
  const primaryTargetPath = primaryTargetHub?.path || "/emaki-hub";
  const primaryTargetLabel = primaryTargetHub
    ? isEn
      ? `Explore "${primaryTargetHub.titleEn || primaryTargetHub.titleJa}" →`
      : `『${primaryTargetHub.titleJa || primaryTargetHub.titleEn}』から選んで切り抜く →`
    : isEn
    ? "Pick a Scroll to Clip →"
    : "絵巻を選んで切り抜く →";

  const handleJumpToScrolls = (e) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && activeBoard?.id) {
      try {
        window.sessionStorage.setItem(
          "emakimono_active_collab_room_v1",
          JSON.stringify({ id: activeBoard.id, title: activeBoard.title || "" })
        );
      } catch {}
    }
    router.push(primaryTargetPath, undefined, { locale: router.locale });
  };

  // 背景ドラッグ（ホワイトボードのパン移動）
  const handleCanvasPointerDown = (e) => {
    logBoardDebug("CANVAS_DOWN", {
      isFullscreen,
      pointerId: e.pointerId,
      dragActive: dragRef.current.active,
      panActive: panRef.current.active,
      targetTag: e.target?.tagName,
      currentTag: e.currentTarget?.tagName,
    });
    if (dragRef.current.active) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    panRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: viewport.x,
      origY: viewport.y,
    };
    setIsPanning(true);
    setActiveCardId(null);
    setShowHowTo(false);
  };

  const handleCanvasPointerMove = (e) => {
    if (dragRef.current.active || !panRef.current.active) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    logBoardDebug("CANVAS_MOVE", { isFullscreen, pointerId: e.pointerId, dx, dy });
    setViewport((prev) => ({
      ...prev,
      x: panRef.current.origX + dx,
      y: panRef.current.origY + dy,
    }));
  };

  const handleCanvasPointerUp = (e) => {
    if (!panRef.current.active) return;
    logBoardDebug("CANVAS_UP", { isFullscreen, pointerId: e.pointerId });
    panRef.current.active = false;
    setIsPanning(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // カードのドラッグ移動（ローカルお試し操作＆最前面化）
  const handleCardPointerDown = (e, item) => {
    e.stopPropagation();
    logBoardDebug("CARD_DOWN", {
      isFullscreen,
      cardId: item.id,
      pointerId: e.pointerId,
      panActiveBefore: panRef.current.active,
      targetTag: e.target?.tagName,
    });
    if (e.button !== 0 && e.pointerType === "mouse") return;
    panRef.current.active = false;
    setIsPanning(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);

    setActiveCardId(item.id);
    dragRef.current = {
      active: true,
      cardId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.boardX || 0,
      origY: item.boardY || 0,
    };

    if (!activeBoard?.id) return;
    setItemsByBoardId((prev) => {
      const list = prev[activeBoard.id] || [];
      const maxZ = list.reduce((m, c) => Math.max(m, c.zIndex || 1), 1);
      return {
        ...prev,
        [activeBoard.id]: list.map((c) =>
          c.id === item.id ? { ...c, zIndex: maxZ + 1 } : c
        ),
      };
    });
  };

  const handleCardPointerMove = (e) => {
    if (!dragRef.current.active || !activeBoard?.id) return;
    e.stopPropagation();
    const dx = (e.clientX - dragRef.current.startX) / (viewportRef.current?.scale || 1);
    const dy = (e.clientY - dragRef.current.startY) / (viewportRef.current?.scale || 1);
    const nextX = Math.round(dragRef.current.origX + dx);
    const nextY = Math.round(dragRef.current.origY + dy);
    const targetId = dragRef.current.cardId;
    logBoardDebug("CARD_MOVE", {
      isFullscreen,
      targetId,
      panActive: panRef.current.active,
      nextX,
      nextY,
    });

    setItemsByBoardId((prev) => ({
      ...prev,
      [activeBoard.id]: (prev[activeBoard.id] || []).map((c) =>
        c.id === targetId ? { ...c, boardX: nextX, boardY: nextY } : c
      ),
    }));
  };

  const handleCardPointerUp = (e) => {
    if (!dragRef.current.active) return;
    e.stopPropagation();
    dragRef.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleToggleLike = (e, itemId) => {
    e.stopPropagation();
    setLikedIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const zoomBy = (delta) => {
    setViewport((prev) => ({
      ...prev,
      scale:
        Math.round(Math.min(1.8, Math.max(0.45, prev.scale + delta)) * 100) /
        100,
    }));
  };

  return {
    boards,
    selectedBoardId,
    isLoadingList,
    isLoadingItems,
    viewport,
    isPanning,
    activeCardId,
    likedIds,
    showHowTo,
    setShowHowTo,
    isFullscreen,
    setIsFullscreen,
    canvasRef,
    activeBoard,
    activeItems,
    relatedHubs,
    primaryTargetLabel,
    applyFitForItems,
    handleSelectTab,
    handleJumpToScrolls,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCardPointerDown,
    handleCardPointerMove,
    handleCardPointerUp,
    handleToggleLike,
    zoomBy,
  };
}