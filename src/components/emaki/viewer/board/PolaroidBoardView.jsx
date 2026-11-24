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
  const isEn = router.locale === "en";

  const sharedParam = typeof router.query.d === "string" ? router.query.d : "";
  const roomParam = typeof router.query.room === "string" ? router.query.room.trim() : "";
  const personalParam =
    typeof router.query.personal === "string" ? router.query.personal.trim() : "";
  const isCollabMode = Boolean(roomParam);

  // usePolaroidBoardSync と usePolaroidBoardCanvas 間で共有するBridge Ref
  const bridgeRefs = useRef({
    setCollabBoard: () => {},
    setRoomError: () => {},
    setPersonalMeta: () => {},
    setCollabTitleDraft: () => {},
    hasInitialFitRef: { current: false },
    activeBoardContextRef: { current: null },
    allowViewportPersistRef: { current: false },
    localMovedCoordsRef: { current: {} },
    dragStateRef: { current: { id: null } },
    applyInitialViewportForItems: () => {},
    setItems: () => {},
    bringToFront: () => {},
  });

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
    setPersonalMeta: (v) => bridgeRefs.current.setPersonalMeta(v),
    setCollabTitleDraft: (v) => bridgeRefs.current.setCollabTitleDraft(v),
    hasInitialFitRef: bridgeRefs.current.hasInitialFitRef,
    activeBoardContextRef: bridgeRefs.current.activeBoardContextRef,
    allowViewportPersistRef: bridgeRefs.current.allowViewportPersistRef,
    localMovedCoordsRef: bridgeRefs.current.localMovedCoordsRef,
    dragStateRef: bridgeRefs.current.dragStateRef,
    applyInitialViewportForItems: (...args) =>
      bridgeRefs.current.applyInitialViewportForItems(...args),
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
  } = sync;

  bridgeRefs.current.setCollabBoard = setCollabBoard;
  bridgeRefs.current.setRoomError = setRoomError;
  bridgeRefs.current.setItems = setItems;
  bridgeRefs.current.bringToFront = bringToFront;

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

  bridgeRefs.current.setPersonalMeta = setPersonalMeta;
  bridgeRefs.current.setCollabTitleDraft = setCollabTitleDraft;

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
  });

  const {
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
  } = canvas;

  bridgeRefs.current.hasInitialFitRef = hasInitialFitRef;
  bridgeRefs.current.activeBoardContextRef = activeBoardContextRef;
  bridgeRefs.current.allowViewportPersistRef = allowViewportPersistRef;
  bridgeRefs.current.localMovedCoordsRef = localMovedCoordsRef;
  bridgeRefs.current.dragStateRef = dragStateRef;
  bridgeRefs.current.applyInitialViewportForItems = applyInitialViewportForItems;

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
