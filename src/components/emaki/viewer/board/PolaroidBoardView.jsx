import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./PolaroidBoardView.module.css";
import { PolaroidBoardCard } from "./PolaroidBoardCard";
import { PolaroidBoardHeader } from "./PolaroidBoardHeader";
import { PolaroidBoardTabs } from "./PolaroidBoardTabs";
import { PolaroidBoardInfoCard } from "./PolaroidBoardInfoCard";
import {
  loadBoardItems,
  saveBoardItems,
  encodeBoardShareUrl,
  decodeBoardShareParam,
  listPersonalBoards,
  DEFAULT_PERSONAL_BOARD,
} from "./polaroidBoardStorage";
import {
  addCollabBoardItem,
  createCollabBoard,
  deleteCollabBoardItem,
  fetchCollabBoard,
  fetchPublicBoards,
  toggleCollabBoardItemLike,
  updateCollabBoardItem,
} from "@/libs/api/ugcApi";
import { usePolaroidBoardMeta } from "./usePolaroidBoardMeta";
import {
  ACTIVE_COLLAB_ROOM_KEY,
  AUTHOR_NAME_KEY,
  buildSourceHref,
  getBoardPermissions,
  getBoardCardPermissions,
  parseOdaiMeta,
  computeCardRuleBadges,
} from "./polaroidBoardPolicy";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";
import emakisData from "@/data/scroll-metadata";

export function PolaroidBoardView() {
  const router = useRouter();
  const isEn = router.locale === "en";
  const [likedIds, setLikedIds] = useState({});
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [publicBoards, setPublicBoards] = useState([]);
  const [publishingCardId, setPublishingCardId] = useState(null);
  const [selectedPublicBoardId, setSelectedPublicBoardId] = useState("");
  const [isPublishingCard, setIsPublishingCard] = useState(false);

  const openPublishPicker = async (e, cardId) => {
    e.stopPropagation();
    if (publishingCardId === cardId) {
      setPublishingCardId(null);
      return;
    }
    setPublishingCardId(cardId);
    if (publicBoards.length === 0) {
      try {
        const res = await fetchPublicBoards();
        const list = Array.isArray(res?.boards) ? res.boards : [];
        setPublicBoards(list);
        if (list[0]?.id) {
          setSelectedPublicBoardId(list[0].id);
        }
      } catch {
        // 取得失敗時は空リストのまま
      }
    } else if (!selectedPublicBoardId && publicBoards[0]?.id) {
      setSelectedPublicBoardId(publicBoards[0].id);
    }
  };

  const handlePublishCardToPublicBoard = async (e, item) => {
    e.stopPropagation();
    if (!selectedPublicBoardId || isPublishingCard) return;
    setIsPublishingCard(true);
    try {
      const authorName =
        typeof window !== "undefined"
          ? window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
          : "";
      await addCollabBoardItem(selectedPublicBoardId, {
        scrollId: item.scrollId,
        sceneIndex: item.sceneIndex,
        src: item.src,
        pan: item.pan,
        zoom: item.zoom,
        coverScale: item.coverScale,
        cx: item.cx,
        cy: item.cy,
        cz: item.cz,
        theme: item.theme,
        displayTitle: item.displayTitle,
        displayChapter: item.displayChapter,
        message: item.message || item.memo || "",
        authorName,
      });
      setPublishingCardId(null);
      router.push(
        `/board?room=${encodeURIComponent(selectedPublicBoardId)}`,
        undefined,
        { locale: router.locale }
      );
    } catch (err) {
      alert(err.message || "公開ボードへの投稿に失敗しました");
    } finally {
      setIsPublishingCard(false);
    }
  };

  const handleToggleCardLike = async (e, cardId) => {
    e.stopPropagation();
    const nextLiked = !likedIds[cardId];
    const delta = nextLiked ? 1 : -1;

    setLikedIds((prev) => {
      const updated = { ...prev, [cardId]: nextLiked };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("emakimono_polaroid_likes_v1", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (isCollabMode && roomParam) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === cardId
            ? { ...it, likeCount: Math.max(0, (Number(it.likeCount) || 0) + delta) }
            : it
        )
      );
      try {
        const res = await toggleCollabBoardItemLike(roomParam, cardId, delta);
        if (res?.item && typeof res.item.likeCount === "number") {
          setItems((prev) =>
            prev.map((it) =>
              it.id === cardId ? { ...it, likeCount: res.item.likeCount } : it
            )
          );
        }
      } catch (err) {
        console.warn("toggleCollabBoardItemLike failed:", err);
      }
    }
  };

  const handleShareCard = async (e, item) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopiedCardId(item.id);
      window.setTimeout(() => {
        setCopiedCardId((cur) => (cur === item.id ? null : cur));
      }, 1800);
    } catch {
      // clipboard 失敗時はフォールバックしない
    }
  };

  const sharedParam = typeof router.query.d === "string" ? router.query.d : "";
  const roomParam = typeof router.query.room === "string" ? router.query.room.trim() : "";
  const personalParam =
    typeof router.query.personal === "string" ? router.query.personal.trim() : "";

  const [items, setItems] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [collabBoard, setCollabBoard] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [roomError, setRoomError] = useState("");
  const isCollabMode = Boolean(roomParam);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState(null);
  // =============================================================================
  // デバッグスイッチ（検証完了後は false にして一括停止）
  // =============================================================================
  const DEBUG_BOARD_PERF = false;
  const logBoardDebug = (tag, ...args) => {
    if (!DEBUG_BOARD_PERF) return;
    const time = performance.now().toFixed(1);
    console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
  };

  const [viewport, setViewport] = useState({ x: 340, y: 64, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [rasterizeTick, setRasterizeTick] = useState(0);

  const {
    personalMeta,
    setPersonalMeta,
    collabTitleDraft,
    setCollabTitleDraft,
    parsedCollab,
    visibleTabs,
    activeTabKey,
    handleSavePersonalTitle,
    handleSavePersonalDescription,
    handleSavePersonalRelatedHubs,
    handleSaveCollabTitle,
    handleSaveCollabDescription,
    handleSaveCollabRelatedHubs,
    handleSelectTab,
    handleCreateThemeFromTab,
    handleSwitchToPersonalBoard,
    handleSwitchToPublicBoard,
  } = usePolaroidBoardMeta({
    router,
    isCollabMode,
    roomParam,
    personalParam,
    collabBoard,
    setCollabBoard,
    setRoomError,
  });

  const canvasOuterRef = useRef(null);
  const hasInitialFitRef = useRef(false);
  const localMovedCoordsRef = useRef({});
  const placeholderAnchorRef = useRef({ boardKey: null, x: 320, y: 140 });

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
  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const dragStateRef = useRef({
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRasterizeTick((t) => t + 1);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [viewport.scale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAuthor = window.localStorage.getItem(AUTHOR_NAME_KEY) || "";
    setAuthorName(savedAuthor);
    if (typeof window !== "undefined") {
      try {
        const rawLikes = window.localStorage.getItem("emakimono_polaroid_likes_v1");
        if (rawLikes) setLikedIds(JSON.parse(rawLikes));
      } catch {}
    }
  }, []);

  const loadCollabRoom = async (roomId, showFeedback = false) => {
    if (showFeedback) {
      setIsRefreshing(true);
      setRefreshSuccess(false);
    }
    try {
      const data = await fetchCollabBoard(roomId);
      const loadedItems = Array.isArray(data.items) ? data.items : [];
      const overrides = localMovedCoordsRef.current || {};
      const mergedItems = loadedItems.map((it) => {
        const ov = overrides[it.id];
        if (!ov) return it;
        return {
          ...it,
          boardX: typeof ov.boardX === "number" ? ov.boardX : it.boardX,
          boardY: typeof ov.boardY === "number" ? ov.boardY : it.boardY,
          zIndex: typeof ov.zIndex === "number" ? ov.zIndex : it.zIndex,
        };
      });
        setCollabBoard(data.board);
        setCollabTitleDraft(data.board?.title || "");
        setItems(mergedItems);
        if (!hasInitialFitRef.current || router.query?.pinned === "1") {
          hasInitialFitRef.current = true;
          fitViewportToItems(mergedItems);
          if (router.query?.pinned === "1") {
            const nextQuery = { ...router.query };
            delete nextQuery.pinned;
            router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
              shallow: true,
            });
          }
        }
        setRoomError("");
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          ACTIVE_COLLAB_ROOM_KEY,
          JSON.stringify({ id: roomId, title: data.board?.title || "" })
        );
      }
      if (showFeedback) {
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 1800);
      }
    } catch (error) {
      setRoomError(error.message || "Failed to load board");
    } finally {
      if (showFeedback) setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    hasInitialFitRef.current = false;
    localMovedCoordsRef.current = {};

    if (roomParam) {
      setIsSharedMode(false);
      loadCollabRoom(roomParam);
      const timer = setInterval(() => {
        if (!dragStateRef.current?.id) {
          loadCollabRoom(roomParam);
        }
      }, 10000);
      return () => clearInterval(timer);
    }

    setCollabBoard(null);
    setRoomError("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ACTIVE_COLLAB_ROOM_KEY);
    }

    if (sharedParam) {
      const restored = decodeBoardShareParam(sharedParam);
      if (restored) {
        setItems(restored);
        setIsSharedMode(true);
        hasInitialFitRef.current = true;
        fitViewportToItems(restored);
        setIsInitialLoading(false);
        return;
      }
    }
    const boardId = personalParam || "default";
    const localItems = loadBoardItems(boardId);
    setItems(localItems);
    setIsSharedMode(false);
    const boards = listPersonalBoards();
    const meta = boards.find((b) => b.id === boardId) || DEFAULT_PERSONAL_BOARD;
    setPersonalMeta({
      title: meta.title || DEFAULT_PERSONAL_BOARD.title,
      description: meta.description || DEFAULT_PERSONAL_BOARD.description,
      relatedHubs: Array.isArray(meta.relatedHubs) ? meta.relatedHubs : [],
    });
    hasInitialFitRef.current = true;
    fitViewportToItems(localItems);
    setIsInitialLoading(false);
  }, [router.isReady, sharedParam, roomParam, personalParam]);

  const boardPerms = getBoardPermissions({ isCollabMode, isSharedMode });

  const updateAndPersist = (nextItems) => {
    setItems(nextItems);
    if (boardPerms.persistToLocalStorage) {
      saveBoardItems(nextItems, personalParam || "default");
    }
  };

  const handleAuthorNameChange = (val) => {
    setAuthorName(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTHOR_NAME_KEY, val);
    }
  };

  const handleCreateCollabRoom = async () => {
    if (isCreatingRoom) return;
    setIsCreatingRoom(true);
    try {
      const res = await createCollabBoard({
        title: isEn ? "Shared Emaki Polaroid Board" : "みんなの絵巻ポラロイドボード",
        authorName,
        items,
      });
      if (res?.board?.id) {
        const targetPath = `/board?room=${encodeURIComponent(res.board.id)}`;
        if (typeof window !== "undefined") {
          const shareUrl = `${window.location.origin}${targetPath}`;
          await navigator.clipboard?.writeText(shareUrl).catch(() => {});
        }
        await router.push(targetPath);
        alert(
          isEn
            ? "Shared board link copied! Send this URL so anyone can pin polaroids together."
            : "共有ボードのURLをコピーしました！このリンクを送ると、みんなで同じボードにポラロイドを貼れます。"
        );
      }
    } catch (error) {
      alert(error.message || "コラボボードの作成に失敗しました");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleCopyCollabInviteUrl = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    await navigator.clipboard?.writeText(url);
    alert(
      isEn
        ? "Collab invite URL copied!"
        : "コラボボードの招待URLをコピーしました！リンクを送ると誰でもポラロイドを貼れます。"
    );
  };

  const bringToFront = (id) => {
    setActiveId(id);
    setItems((prev) => {
      const maxZ = prev.reduce((acc, cur) => Math.max(acc, cur.zIndex || 1), 1);
      const next = prev.map((it) => (it.id === id ? { ...it, zIndex: maxZ + 1 } : it));
      if (boardPerms.persistToLocalStorage) {
        saveBoardItems(next, personalParam || "default");
      }
      const shouldTrackLocal =
        isCollabMode || (!boardPerms.persistToLocalStorage && !isSharedMode);
      if (shouldTrackLocal) {
        const it = next.find((x) => x.id === id);
        if (it) {
          const prevOv = localMovedCoordsRef.current[id] || {};
          localMovedCoordsRef.current[id] = {
            boardX: typeof it.boardX === "number" ? it.boardX : prevOv.boardX,
            boardY: typeof it.boardY === "number" ? it.boardY : prevOv.boardY,
            zIndex: maxZ + 1,
          };
        }
      }
      return next;
    });
  };

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

  const handleCardPointerDown = (e, item) => {
    e.stopPropagation();
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON" || e.target.tagName === "A") {
      return;
    }
    // 公開ボード・共有ボード・個人ボードいずれもドラッグ移動を許可（保存は pointerUp で制御）
    const cardEl = e.currentTarget;
    cardEl.setPointerCapture(e.pointerId);
    bringToFront(item.id);
    const origX = item.boardX || 0;
    const origY = item.boardY || 0;
    dragStateRef.current = {
      id: item.id,
      el: cardEl,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
      lastX: origX,
      lastY: origY,
      rafId: null,
    };
  };

  const handleCardPointerMove = (e) => {
    const st = dragStateRef.current;
    if (!st.id) return;
    e.stopPropagation();
    const dx = (e.clientX - st.startX) / viewport.scale;
    const dy = (e.clientY - st.startY) / viewport.scale;
    st.lastX = st.origX + dx;
    st.lastY = st.origY + dy;
    if (st.rafId === null && st.el) {
      st.rafId = window.requestAnimationFrame(() => {
        st.rafId = null;
        if (!st.el) return;
        const curTransform = st.el.style.transform || "";
        const rotateMatch = curTransform.match(/rotate\([^)]+\)/);
        const rotatePart = rotateMatch ? ` ${rotateMatch[0]}` : "";
        st.el.style.transform = `translate3d(${st.lastX}px, ${st.lastY}px, 0)${rotatePart}`;
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
    const finalX = st.lastX;
    const finalY = st.lastY;
    dragStateRef.current = {
      id: null,
      el: null,
      startX: 0,
      startY: 0,
      origX: 0,
      origY: 0,
      lastX: 0,
      lastY: 0,
      rafId: null,
    };
    const shouldTrackLocal =
      isCollabMode || (!boardPerms.persistToLocalStorage && !isSharedMode);
    setItems((prev) => {
      const next = prev.map((it) =>
        it.id === movedId ? { ...it, boardX: finalX, boardY: finalY } : it
      );
      if (shouldTrackLocal) {
        const moved = next.find((it) => it.id === movedId);
        if (moved) {
          const prevOv = localMovedCoordsRef.current[movedId] || {};
          localMovedCoordsRef.current[movedId] = {
            boardX: moved.boardX,
            boardY: moved.boardY,
            ...(typeof moved.zIndex === "number"
              ? { zIndex: moved.zIndex }
              : typeof prevOv.zIndex === "number"
                ? { zIndex: prevOv.zIndex }
                : {}),
          };
        }
      }
      if (boardPerms.persistToLocalStorage && !isCollabMode && !isSharedMode) {
        saveBoardItems(next, personalParam || "default");
      }
      return next;
    });
  };

  const handleMessageChange = (id, message) => {
    const next = items.map((it) => (it.id === id ? { ...it, message, memo: "" } : it));
    updateAndPersist(next);
    if (isCollabMode && roomParam) {
      updateCollabBoardItem(roomParam, { itemId: id, message }).catch(() => {});
    }
  };

  const handleDelete = (id) => {
    const next = items.filter((it) => it.id !== id);
    updateAndPersist(next);
    if (isCollabMode && roomParam) {
      deleteCollabBoardItem(roomParam, id).catch(() => {});
    }
  };

  const handleCopyShareUrl = async () => {
    const url = encodeBoardShareUrl(items, router.locale || "ja");
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(isEn ? "Copy this board URL:" : "以下の共有URLをコピーしてください:", url);
    }
  };

  const handleSaveSharedToMyBoard = () => {
    saveBoardItems(items);
    setIsSharedMode(false);
    router.replace("/board", undefined, { shallow: true });
  };

  return (
    <div className={styles.page}>
      <PolaroidBoardHeader
        isEn={isEn}
        locale={router.locale}
        isCollabMode={isCollabMode}
        onSwitchToPersonal={handleSwitchToPersonalBoard}
        onSwitchToPublic={handleSwitchToPublicBoard}
      />
      <PolaroidBoardTabs
        isEn={isEn}
        isCollabMode={isCollabMode}
        tabs={visibleTabs}
        activeKey={activeTabKey}
        onSelectTab={handleSelectTab}
        onCreateTheme={handleCreateThemeFromTab}
      />

      {router.query?.pinned === "1" && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 999,
            backgroundColor: "#1e293b",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.25)",
          }}
        >
          <span>
            {isEn
              ? "✨ Pinned your Polaroid to the public board!"
              : "✨ 公開ボードにあなたのポラロイドを貼りました！"}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextQuery = { ...router.query };
              delete nextQuery.pinned;
              router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
                shallow: true,
              });
            }}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              color: "#cbd5e1",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ホワイトボードキャンバス（パン＆ズーム対応） */}
      <main
        ref={canvasOuterRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`,
        }}
        className={`${styles.canvasOuter} ${isPanning ? styles.canvasOuterPanning : ""}`}
      >
        <PolaroidBoardInfoCard
          authorName={authorName}
          collabBoard={collabBoard}
          isCollabMode={isCollabMode}
          isEn={isEn}
          isRefreshing={isRefreshing}
          isSharedMode={isSharedMode}
          items={items}
          locale={router.locale}
          onAuthorNameChange={handleAuthorNameChange}
          onRefreshRoom={() => loadCollabRoom(roomParam, true)}
          onSaveSharedToMyBoard={handleSaveSharedToMyBoard}
          personalParam={personalParam}
          refreshSuccess={refreshSuccess}
          roomError={roomError}
          roomParam={roomParam}
          setCollabBoard={setCollabBoard}
          setRoomError={setRoomError}
        />
        {!isInitialLoading && !isCollabMode && items.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>
              {isEn ? "Your board is empty" : "まだポラロイドが貼られていません"}
            </p>
            <p className={styles.emptyText}>
              {isEn
                ? "Open any emaki scroll, launch the Polaroid tool, and click 'Pin to Board'."
                : "お好みの絵巻物を開いてポラロイド機能を起動し、「ボードに貼る」を押すとここに並びます。"}
            </p>
            <Link href="/type/emaki" locale={router.locale} passHref>
              <a className={styles.emptyAction}>{isEn ? "Explore Emaki" : "絵巻物を探しに行く"}</a>
            </Link>
          </div>
        ) : (
          <div
            className={styles.canvasInner}
            style={{
              transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
              backfaceVisibility: rasterizeTick % 2 === 0 ? "visible" : "hidden",
            }}
          >
            {(() => {
              const odaiMeta = isCollabMode ? parseOdaiMeta(collabBoard?.description) : null;
              const itemsWithLikes = items.map((it) => ({
                ...it,
                likedIds: likedIds[it.id] ? [it.id] : [],
              }));
              const ruleBadgeMap = computeCardRuleBadges(itemsWithLikes, odaiMeta, isEn);

              return items.map((item) => {
                const ruleBadge = ruleBadgeMap.get(item.id) || null;

                return (
                  <PolaroidBoardCard
                    key={item.id}
                    item={item}
                    isSelected={activeId === item.id}
                    isEn={isEn}
                    locale={router.locale}
                    isSharedMode={isSharedMode}
                    isCollabMode={isCollabMode}
                    isLiked={Boolean(likedIds[item.id])}
                    isCopied={copiedCardId === item.id}
                    sourceHref={buildSourceHref(item)}
                    isPublishingOpen={publishingCardId === item.id}
                    publicBoards={publicBoards}
                    selectedPublicBoardId={selectedPublicBoardId}
                    isPublishingCard={isPublishingCard}
                    ruleBadge={ruleBadge}
                    onDelete={handleDelete}
                    onMessageChange={handleMessageChange}
                    onOpenPublishPicker={openPublishPicker}
                    onPointerDown={handleCardPointerDown}
                    onPointerMove={handleCardPointerMove}
                    onPointerUp={handleCardPointerUp}
                    onPublishCard={handlePublishCardToPublicBoard}
                    onSelectPublicBoardId={setSelectedPublicBoardId}
                    onShareCard={handleShareCard}
                    onToggleLike={handleToggleCardLike}
                  />
                );
              });
            })()}

            {isCollabMode && (() => {
              const descText = String(collabBoard?.description || "");
              const hubMatch = descText.match(/\n?<!--hubs:([^>]*)-->/);
              const rawRelated = hubMatch
                ? hubMatch[1]
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
              const allHubs = getAllHubPages();
              const matchedHubs = allHubs.filter(
                (h) => rawRelated.includes(h.slug) || rawRelated.includes(h.path)
              );
              const primaryHub = matchedHubs.length > 0 ? matchedHubs[0] : null;

              // 紐づくハブ配下の作品を抽出し、1作品のみなら作品ページへダイレクト遷移する
              const hubEmakis = primaryHub ? filterEmakisForHub(emakisData, primaryHub) : [];
              const singleEmaki = hubEmakis.length === 1 ? hubEmakis[0] : null;
              const singleEmakiSlug = singleEmaki?.slug || singleEmaki?.titleen;

              const targetPath = singleEmakiSlug
                ? `/emaki/${encodeURIComponent(singleEmakiSlug)}`
                : primaryHub?.path || "/emaki-hub";

              const targetLabel = singleEmaki
                ? isEn
                  ? `Open "${singleEmaki.titleen || singleEmaki.title}" →`
                  : `『${singleEmaki.title}』を開いて切り抜く →`
                : primaryHub
                ? isEn
                  ? `Explore "${primaryHub.titleEn || primaryHub.titleJa}" →`
                  : `『${primaryHub.titleJa || primaryHub.titleEn}』から選んで切り抜く →`
                : isEn
                ? "Pick a Scroll to Clip →"
                : "絵巻を選んで切り抜く →";

                const { x: phX, y: phY } = resolveFixedPlaceholderPos(items);

              return (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "228px",
                    minHeight: "260px",
                    zIndex: 1,
                    transform: `translate3d(${phX}px, ${phY}px, 0) rotate(1.4deg)`,
                    backgroundColor: "rgba(255, 255, 255, 0.78)",
                    border: "2px dashed rgba(138, 109, 59, 0.45)",
                    borderRadius: 8,
                    padding: "14px 13px 13px",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -9,
                      left: "50%",
                      transform: "translateX(-50%) rotate(2deg)",
                      width: 56,
                      height: 16,
                      background: "rgba(255, 248, 220, 0.85)",
                      border: "1px dashed rgba(138, 109, 59, 0.35)",
                    }}
                  />
                  <div
                    style={{
                      borderRadius: 6,
                      background: "rgba(138, 109, 59, 0.08)",
                      padding: "12px 10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#5c431d" }}>
                      {isEn ? "+ Pin Your Scene" : "＋ あなたの1枚を貼る"}
                    </div>
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      fontSize: 11,
                      lineHeight: 1.55,
                      color: "#334155",
                    }}
                  >
                    <li>
                      {isEn
                        ? "Find a scene matching the theme"
                        : "お題に合う絵巻・場面を探す"}
                    </li>
                    <li>
                      {isEn
                        ? "Tap the 📷 Polaroid button"
                        : "画面の 📷 ボタンを押して切り抜く"}
                    </li>
                    <li>
                      {isEn
                        ? 'Add a note & "Pin to Board"'
                        : "一言を添えて「ボードに貼る」！"}
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined" && collabBoard?.id) {
                        try {
                          window.sessionStorage.setItem(
                            "emakimono_active_collab_room_v1",
                            JSON.stringify({ id: collabBoard.id, title: collabBoard.title || "" })
                          );
                        } catch {}
                      }
                      router.push(targetPath, undefined, { locale: router.locale });
                    }}
                    style={{
                      width: "100%",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "7px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "#8a6d3b",
                      color: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(138, 109, 59, 0.25)",
                    }}
                  >
                    {isEn
                      ? "Explore Scrolls for This Theme →"
                      : "お題に合う絵巻を探す →"}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* 右下ズームコントロール（Figma風） */}
        {items.length > 0 && (
          <div className={styles.zoomControls} onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleZoomStep(-0.15)}
              title={isEn ? "Zoom out" : "縮小"}
              className={styles.zoomBtn}
            >
              −
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              title={isEn ? "Reset zoom & position" : "表示位置と倍率をリセット"}
              className={styles.zoomLabel}
            >
              {Math.round(viewport.scale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoomStep(0.15)}
              title={isEn ? "Zoom in" : "拡大"}
              className={styles.zoomBtn}
            >
              ＋
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
