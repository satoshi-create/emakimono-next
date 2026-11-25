import React, { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./PolaroidBoardView.module.css";
import { PolaroidBoardCard } from "./PolaroidBoardCard";
import { PolaroidBoardHeader } from "./PolaroidBoardHeader";
import { PolaroidBoardTabs } from "./PolaroidBoardTabs";
import { PolaroidBoardInfoCard } from "./PolaroidBoardInfoCard";
import { usePolaroidBoardMeta } from "./usePolaroidBoardMeta";
import { usePolaroidBoardSync } from "./usePolaroidBoardSync";
import { usePolaroidBoardCanvas } from "./usePolaroidBoardCanvas";
import {
  buildSourceHref,
  getBoardCardPermissions,
  parseOdaiMeta,
  computeCardRuleBadges,
} from "./polaroidBoardPolicy";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";
import emakisData from "@/data/scroll-metadata";

export function PolaroidBoardView() {
  const router = useRouter();
  const isJa = router.locale === "ja";
  const isEn = !isJa;

  const sharedParam = typeof router.query.d === "string" ? router.query.d : "";
  const roomParam = typeof router.query.room === "string" ? router.query.room.trim() : "";
  const personalParam =
    typeof router.query.personal === "string" ? router.query.personal.trim() : "";
  const isCollabMode = Boolean(roomParam);

  // Sync ↔ Canvas で同一参照を共有（ドラッグ状態・ローカル座標オーバーライド）
  const localMovedCoordsRef = useRef({});
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
  const pendingPersistRef = useRef({});

  // Sync ↔ Canvas で単一インスタンス共有（Bridge Ref 廃止）
  const hasInitialFitRef = useRef(false);
  const activeBoardContextRef = useRef(null);
  const allowViewportPersistRef = useRef(false);
  const applyViewportRef = useRef(() => {});
  const setPersonalMetaRef = useRef(() => {});
  const setCollabTitleDraftRef = useRef(() => {});

  // ===========================================================================
  // 1. データ取得・コラボルーム同期・アイテムCRUDフック
  // ===========================================================================
  const sync = usePolaroidBoardSync({
    router,
    isEn,
    sharedParam,
    roomParam,
    personalParam,
    isCollabMode,
    setPersonalMeta: (v) => setPersonalMetaRef.current(v),
    setCollabTitleDraft: (v) => setCollabTitleDraftRef.current(v),
    hasInitialFitRef,
    activeBoardContextRef,
    allowViewportPersistRef,
    localMovedCoordsRef,
    dragStateRef,
    pendingPersistRef,
    applyInitialViewportForItems: (...args) => applyViewportRef.current(...args),
  });

  const {
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
  } = sync;

  // ===========================================================================
  // 2. ボードメタ情報・タブ切替フック
  // ===========================================================================
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

  setPersonalMetaRef.current = setPersonalMeta;
  setCollabTitleDraftRef.current = setCollabTitleDraft;

  // ===========================================================================
  // 3. キャンバス Pan/Zoom・カードドラッグ配置フック
  // ===========================================================================
  const canvas = usePolaroidBoardCanvas({
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
    localMovedCoordsRef,
    dragStateRef,
    pendingPersistRef,
    hasInitialFitRef,
    activeBoardContextRef,
    allowViewportPersistRef,
    updateCollabRoomItemsCache,
  });

  const {
    viewport,
    isPanning,
    rasterizeTick,
    canvasOuterRef,
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
  } = canvas;

  applyViewportRef.current = applyInitialViewportForItems;

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
        {isCollabMode && isInitialLoading && items.length === 0 ? (
          <div className={styles.emptyBox} role="status" aria-live="polite">
            <p className={styles.emptyTitle}>
              {isEn ? "Loading board…" : "ボードを読み込んでいます…"}
            </p>
          </div>
        ) : !isInitialLoading && !isCollabMode && items.length === 0 ? (
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
                    dragLivePosition={
                      dragLivePosition?.id === item.id ? dragLivePosition : null
                    }
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
