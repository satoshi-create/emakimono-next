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
  updateCollabBoardItem,
} from "@/libs/api/ugcApi";
import {
  ACTIVE_COLLAB_ROOM_KEY,
  AUTHOR_NAME_KEY,
  buildSourceHref,
} from "./polaroidBoardHelpers";
import { usePolaroidBoardMeta } from "./usePolaroidBoardMeta";
import {
  getBoardPermissions,
  getBoardCardPermissions,
  parseOdaiMeta,
  computeCardRuleBadges,
} from "./polaroidBoardPolicy";

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

  const handleToggleCardLike = (e, cardId) => {
    e.stopPropagation();
    setLikedIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
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
  const [viewport, setViewport] = useState({ x: 48, y: 48, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);

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

  const fitViewportToItems = (targetItems) => {
    if (!Array.isArray(targetItems) || targetItems.length === 0) {
      setViewport({ x: 48, y: 48, scale: 1 });
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

    const rect = canvasOuterRef.current?.getBoundingClientRect();
    const viewW = rect?.width || (typeof window !== "undefined" ? window.innerWidth : 1280);
    const viewH = rect?.height || (typeof window !== "undefined" ? window.innerHeight - 120 : 680);

    const pad = 48;
    const contentW = Math.max(cardW, maxX - minX);
    const contentH = Math.max(cardH, maxY - minY);
    const availW = Math.max(300, viewW - pad * 2);
    const availH = Math.max(240, viewH - pad * 2);

    const rawScale = Math.min(1, availW / contentW, availH / contentH);
    const scale = Math.round(Math.max(0.45, Math.min(1, rawScale)) * 100) / 100;

    const scaledW = contentW * scale;
    const x =
      scaledW < availW
        ? Math.round(pad + (availW - scaledW) / 2 - minX * scale)
        : Math.round(pad - minX * scale);
    const y = Math.round(pad - minY * scale);

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
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedAuthor = window.localStorage.getItem(AUTHOR_NAME_KEY) || "";
    setAuthorName(savedAuthor);
  }, []);

  const loadCollabRoom = async (roomId, showFeedback = false) => {
    if (showFeedback) {
      setIsRefreshing(true);
      setRefreshSuccess(false);
    }
    try {
      const data = await fetchCollabBoard(roomId);
      const loadedItems = Array.isArray(data.items) ? data.items : [];
      setCollabBoard(data.board);
      setCollabTitleDraft(data.board?.title || "");
      setItems(loadedItems);
      if (!hasInitialFitRef.current) {
        hasInitialFitRef.current = true;
        fitViewportToItems(loadedItems);
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
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    hasInitialFitRef.current = false;

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

    const onWheelNative = (e) => {
      if (e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setViewport((prev) => {
        const nextScale = Math.min(2.5, Math.max(0.35, Number((prev.scale * factor).toFixed(3))));
        const rect = el.getBoundingClientRect();
        if (!rect) {
          return { ...prev, scale: nextScale };
        }
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const ratio = nextScale / prev.scale;
        return {
          x: localX - (localX - prev.x) * ratio,
          y: localY - (localY - prev.y) * ratio,
          scale: nextScale,
        };
      });
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
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
    if (!getBoardCardPermissions({ isCollabMode, isSharedMode }, item).canDrag) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    bringToFront(item.id);
    dragStateRef.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.boardX || 0,
      origY: item.boardY || 0,
    };
  };

  const handleCardPointerMove = (e) => {
    const st = dragStateRef.current;
    if (!st.id) return;
    e.stopPropagation();
    const dx = (e.clientX - st.startX) / viewport.scale;
    const dy = (e.clientY - st.startY) / viewport.scale;
    setItems((prev) =>
      prev.map((it) =>
        it.id === st.id
          ? {
              ...it,
              boardX: st.origX + dx,
              boardY: st.origY + dy,
            }
          : it
      )
    );
  };

  const handleCardPointerUp = (e) => {
    const st = dragStateRef.current;
    if (!st.id) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
    const movedId = st.id;
    dragStateRef.current = { id: null, startX: 0, startY: 0, origX: 0, origY: 0 };
    setItems((prev) => {
      if (boardPerms.persistToLocalStorage) {
        saveBoardItems(prev, personalParam || "default");
      }
      if (isCollabMode && roomParam) {
        const moved = prev.find((it) => it.id === movedId);
        if (moved) {
          updateCollabBoardItem(roomParam, {
            itemId: movedId,
            boardX: moved.boardX,
            boardY: moved.boardY,
            zIndex: moved.zIndex,
          }).catch(() => {});
        }
      }
      return prev;
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
          isEn={isEn}
          locale={router.locale}
          isCollabMode={isCollabMode}
          isSharedMode={isSharedMode}
          collabBoard={collabBoard}
          items={items}
          collabTitleDraft={collabTitleDraft}
          setCollabTitleDraft={setCollabTitleDraft}
          collabDescription={parsedCollab.cleanDescription}
          onSaveCollabTitle={handleSaveCollabTitle}
          onSaveCollabDescription={handleSaveCollabDescription}
          personalMeta={personalMeta}
          setPersonalMeta={setPersonalMeta}
          onSavePersonalTitle={handleSavePersonalTitle}
          onSavePersonalDescription={handleSavePersonalDescription}
          relatedHubSlugs={
            isCollabMode
              ? parsedCollab.relatedHubs
              : personalMeta?.relatedHubs || []
          }
          onChangeRelatedHubSlugs={
            isCollabMode ? handleSaveCollabRelatedHubs : handleSavePersonalRelatedHubs
          }
          onSaveSharedToMyBoard={handleSaveSharedToMyBoard}
          roomError={roomError}
          authorName={authorName}
          onAuthorNameChange={handleAuthorNameChange}
          isRefreshing={isRefreshing}
          refreshSuccess={refreshSuccess}
          onRefreshRoom={() => loadCollabRoom(roomParam, true)}
        />
        {items.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>
              {isEn ? "Your board is empty" : "まだポラロイドが貼られていません"}
            </p>
            <p className={styles.emptyText}>
              {isEn
                ? "Open any emaki scroll, launch the Polaroid tool, and click 'Pin to Board'."
                : "お好みの絵巻物を開いてポラロイド機能を起動し、「ボードに貼る」を押すとここに並びます。"}
            </p>
            <Link href="/" passHref>
              <a className={styles.emptyAction}>{isEn ? "Explore Emaki" : "絵巻物を探しに行く"}</a>
            </Link>
          </div>
        ) : (
          <div
            className={styles.canvasInner}
            style={{
              transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
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
