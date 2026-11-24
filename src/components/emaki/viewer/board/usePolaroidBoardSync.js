import { useEffect, useRef, useState } from "react";
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
import {
  ACTIVE_COLLAB_ROOM_KEY,
  AUTHOR_NAME_KEY,
  getBoardPermissions,
} from "./polaroidBoardPolicy";

// =============================================================================
// 1. デバッグロガー（検証完了後は false にして一括停止）
// =============================================================================
const DEBUG_BOARD_PERSIST = true;

export function logBoardPersistDebug(tag, ...args) {
  if (!DEBUG_BOARD_PERSIST) return;
  const time = typeof performance !== "undefined" ? performance.now().toFixed(1) : "0.0";
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

/**
 * 個人ボード・共有URLボード・公開コラボボードのデータ取得・同期・永続化を統括するフック
 */
export function usePolaroidBoardSync({
  router,
  isEn,
  sharedParam,
  roomParam,
  personalParam,
  isCollabMode,
  setPersonalMeta,
  setCollabTitleDraft,
  hasInitialFitRef,
  activeBoardContextRef,
  allowViewportPersistRef,
  localMovedCoordsRef,
  dragStateRef,
  pendingPersistRef,
  applyInitialViewportForItems,
}) {
  // ===========================================================================
  // 2. ボードアイテム・コラボルーム・公開投稿の状態管理
  // ===========================================================================
  const [items, setItems] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [collabBoard, setCollabBoard] = useState(null);
  const [authorName, setAuthorName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [likedIds, setLikedIds] = useState({});
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [publicBoards, setPublicBoards] = useState([]);
  const [publishingCardId, setPublishingCardId] = useState(null);
  const [selectedPublicBoardId, setSelectedPublicBoardId] = useState("");
  const [isPublishingCard, setIsPublishingCard] = useState(false);

  // ルームIDごとのボードメタ・アイテムキャッシュ（タブ切替時の即時表示用）
  const collabCacheRef = useRef({});
  const activeRoomRef = useRef(roomParam);
  activeRoomRef.current = roomParam;

  const boardPerms = getBoardPermissions({ isCollabMode, isSharedMode });

  // ===========================================================================
  // 3. 初期ローカルストレージ復元（投稿者名・いいね履歴）
  // ===========================================================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAuthor = window.localStorage.getItem(AUTHOR_NAME_KEY) || "";
    setAuthorName(savedAuthor);
    try {
      const rawLikes = window.localStorage.getItem("emakimono_polaroid_likes_v1");
      if (rawLikes) setLikedIds(JSON.parse(rawLikes));
    } catch {}
  }, []);

  // ===========================================================================
  // 4. 公開コラボボードの取得・ポーリング同期
  //    ドラッグ中のローカル移動座標（localMovedCoordsRef）は上書きせずマージ保持する
  // ===========================================================================
  const loadCollabRoom = async (roomId, showFeedback = false) => {
    if (showFeedback) {
      setIsRefreshing(true);
      setRefreshSuccess(false);
    }
    try {
      const data = await fetchCollabBoard(roomId);
      // 非同期通信中に別タブへ切り替わっていた場合は古いレスポンスを破棄
      if (activeRoomRef.current !== roomId) return;
      const loadedItems = Array.isArray(data.items) ? data.items : [];
      logBoardPersistDebug(
        "LOAD_COLLAB",
        roomId,
        JSON.stringify(
          loadedItems.map((it) => ({ id: it.id, boardX: it.boardX, boardY: it.boardY }))
        )
      );
      const overrides = localMovedCoordsRef.current || {};
      const pending = pendingPersistRef?.current || {};
      const mergedItems = loadedItems.map((it) => {
        const pend = pending[it.id];
        const ov = overrides[it.id];
        if (pend && Date.now() - (pend.ts || 0) < 120000) {
          return {
            ...it,
            boardX: typeof pend.boardX === "number" ? pend.boardX : it.boardX,
            boardY: typeof pend.boardY === "number" ? pend.boardY : it.boardY,
          };
        }
        if (!ov) return it;
        // DB側がすでに同座標へ更新済みならローカル一時上書きを解除してDBを正とする
        if (
          typeof ov.boardX === "number" &&
          typeof ov.boardY === "number" &&
          Math.round(Number(it.boardX)) === Math.round(ov.boardX) &&
          Math.round(Number(it.boardY)) === Math.round(ov.boardY)
        ) {
          delete overrides[it.id];
          return it;
        }
        return {
          ...it,
          boardX: typeof ov.boardX === "number" ? ov.boardX : it.boardX,
          boardY: typeof ov.boardY === "number" ? ov.boardY : it.boardY,
          zIndex: typeof ov.zIndex === "number" ? ov.zIndex : it.zIndex,
        };
      });
      collabCacheRef.current[roomId] = {
        board: data.board,
        items: mergedItems,
      };
      setCollabBoard(data.board);
      setCollabTitleDraft(data.board?.title || "");
      setItems(mergedItems);
      if (!hasInitialFitRef.current || router.query?.pinned === "1") {
        hasInitialFitRef.current = true;
        applyInitialViewportForItems(mergedItems, { forceFit: true });
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
    const boardContextKey =
      roomParam ||
      (sharedParam ? `shared:${sharedParam.slice(0, 48)}` : `personal:${personalParam || "default"}`);
    if (activeBoardContextRef.current !== boardContextKey) {
      activeBoardContextRef.current = boardContextKey;
      hasInitialFitRef.current = false;
      allowViewportPersistRef.current = false;
      localMovedCoordsRef.current = {};
    }

    if (roomParam) {
      setIsSharedMode(false);
      // タブ切替時は前ルームの一時上書き座標を破棄し、DB値を正として同期する
      localMovedCoordsRef.current = {};
      const cached = collabCacheRef.current[roomParam];
      if (cached) {
        setCollabBoard(cached.board);
        setCollabTitleDraft(cached.board?.title || "");
        setItems(cached.items);
        setIsInitialLoading(false);
        hasInitialFitRef.current = true;
        applyInitialViewportForItems(cached.items, { forceFit: true });
      } else {
        setItems([]);
        setIsInitialLoading(true);
      }
      loadCollabRoom(roomParam);
      const timer = setInterval(() => {
        if (dragStateRef.current?.id) return;
        const pend = pendingPersistRef?.current;
        if (pend && Object.keys(pend).length > 0) return;
        loadCollabRoom(roomParam);
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
        applyInitialViewportForItems(restored, { forceFit: true });
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
    applyInitialViewportForItems(localItems, { forceFit: true });
    setIsInitialLoading(false);
  }, [router.isReady, sharedParam, roomParam, personalParam]);

  // ===========================================================================
  // 5. アイテムCRUD・重なり順（zIndex）・投稿者名ハンドラ
  // ===========================================================================
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
        const prevOv = localMovedCoordsRef.current[id] || {};
        localMovedCoordsRef.current[id] = {
          ...prevOv,
          zIndex: maxZ + 1,
        };
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

  // ===========================================================================
  // 6. コラボルーム作成・公開ボード投稿・いいね・共有URL操作
  // ===========================================================================
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
      const savedAuthorName =
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
        authorName: savedAuthorName,
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

  const updateCollabRoomItemsCache = (roomId, nextItems) => {
    if (!roomId || !Array.isArray(nextItems)) return;
    const cached = collabCacheRef.current[roomId];
    if (!cached) return;
    collabCacheRef.current[roomId] = { ...cached, items: nextItems };
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

  return {
    items,
    setItems,
    isInitialLoading,
    isSharedMode,
    collabBoard,
    setCollabBoard,
    authorName,
    isCreatingRoom,
    isRefreshing,
    refreshSuccess,
    roomError,
    setRoomError,
    copied,
    activeId,
    likedIds,
    copiedCardId,
    publicBoards,
    publishingCardId,
    selectedPublicBoardId,
    setSelectedPublicBoardId,
    isPublishingCard,
    boardPerms,
    loadCollabRoom,
    handleAuthorNameChange,
    bringToFront,
    handleMessageChange,
    handleDelete,
    handleCreateCollabRoom,
    handleCopyCollabInviteUrl,
    openPublishPicker,
    handlePublishCardToPublicBoard,
    handleToggleCardLike,
    handleShareCard,
    handleCopyShareUrl,
    handleSaveSharedToMyBoard,
    updateCollabRoomItemsCache,
  };
}