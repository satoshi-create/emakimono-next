import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./PolaroidBoardView.module.css";
import {
  THEMES,
  PHOTO_DW,
  PHOTO_DH,
  getThemeTextureUrl,
} from "./polaroidCanvasRenderer";
import {
  loadBoardItems,
  saveBoardItems,
  encodeBoardShareUrl,
  decodeBoardShareParam,
} from "./polaroidBoardStorage";
import {
  createCollabBoard,
  fetchCollabBoard,
  updateCollabBoardTitle,
  updateCollabBoardItem,
  deleteCollabBoardItem,
} from "@/libs/api/ugcApi";

const CARD_PHOTO_W = 216;
const CARD_PHOTO_H = Math.round((CARD_PHOTO_W * PHOTO_DH) / PHOTO_DW); // 168px (720:560比率)

function PolaroidCardPreview({ item }) {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const r = CARD_PHOTO_W / PHOTO_DW;
  const cs = item.coverScale || 1;
  const z = item.zoom || 1.5;

  const dw = imgSize.w ? imgSize.w * cs * z * r : 0;
  const dh = imgSize.h ? imgSize.h * cs * z * r : 0;
  const tx = (item.pan?.x || 0) * r;
  const ty = (item.pan?.y || 0) * r;

  return (
    <div
      style={{
        width: `${CARD_PHOTO_W}px`,
        height: `${CARD_PHOTO_H}px`,
      }}
      className={styles.photoBox}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.displayTitle || "Emaki Polaroid"}
          draggable={false}
          onLoad={(e) => {
            const target = e.currentTarget;
            if (target.naturalWidth && target.naturalHeight) {
              setImgSize({ w: target.naturalWidth, h: target.naturalHeight });
            }
          }}
          style={
            dw > 0
              ? {
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${dw}px`,
                  height: `${dh}px`,
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                }
              : {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }
          }
        />
      ) : null}
    </div>
  );
}

const ACTIVE_COLLAB_ROOM_KEY = "emakimono_active_collab_room_v1";
const AUTHOR_NAME_KEY = "emakimono_polaroid_author_v1";

export function PolaroidBoardView() {
  const router = useRouter();
  const isEn = router.locale === "en";
  const sharedParam = typeof router.query.d === "string" ? router.query.d : "";
  const roomParam = typeof router.query.room === "string" ? router.query.room.trim() : "";

  const [items, setItems] = useState([]);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [collabBoard, setCollabBoard] = useState(null);
  const [collabTitleDraft, setCollabTitleDraft] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [roomError, setRoomError] = useState("");
  const isCollabMode = Boolean(roomParam);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);

  const canvasOuterRef = useRef(null);
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
      setCollabBoard(data.board);
      setCollabTitleDraft(data.board?.title || "");
      setItems(Array.isArray(data.items) ? data.items : []);
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
        return;
      }
    }
    setItems(loadBoardItems());
    setIsSharedMode(false);
  }, [router.isReady, sharedParam, roomParam]);

  const updateAndPersist = (nextItems) => {
    setItems(nextItems);
    if (!isSharedMode && !isCollabMode) {
      saveBoardItems(nextItems);
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

  const handleSaveCollabTitle = async () => {
    if (!roomParam || !collabTitleDraft.trim()) return;
    try {
      await updateCollabBoardTitle(roomParam, collabTitleDraft.trim());
      setCollabBoard((prev) => (prev ? { ...prev, title: collabTitleDraft.trim() } : prev));
    } catch {
      // ignore
    }
  };

  const bringToFront = (id) => {
    setActiveId(id);
    setItems((prev) => {
      const maxZ = prev.reduce((acc, cur) => Math.max(acc, cur.zIndex || 1), 1);
      const next = prev.map((it) => (it.id === id ? { ...it, zIndex: maxZ + 1 } : it));
      if (!isSharedMode) saveBoardItems(next);
      return next;
    });
  };

  const handleCanvasPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
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
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  const handleCardPointerDown = (e, item) => {
    e.stopPropagation();
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON" || e.target.tagName === "A") {
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
      if (!isSharedMode && !isCollabMode) {
        saveBoardItems(prev);
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
      {/* 上部ツールバー */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" passHref>
            <a className={styles.backLink}>{isEn ? "← Gallery" : "← 絵巻一覧へ"}</a>
          </Link>
          <div>
            <h1 className={styles.title}>
              {isEn ? "Emaki Polaroid Board" : "絵巻ポラロイド・ホワイトボード"}
            </h1>
            <p className={styles.subtitle}>
              {isEn
                ? "Drag cards to arrange your personal curation."
                : "ポラロイドを自由に並べて、自分だけの鑑賞ボードを作れます"}
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          {isCollabMode ? (
            <>
              <button
                type="button"
                onClick={handleCopyCollabInviteUrl}
                className={styles.primaryBtn}
              >
                {isEn ? "Copy Share Link" : "共有リンクをコピー"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/board")}
                className={styles.collabMiniBtn}
              >
                {isEn ? "New Personal Board" : "個人ボードへ切替"}
              </button>
            </>
          ) : isSharedMode ? (
            <button type="button" onClick={handleSaveSharedToMyBoard} className={styles.saveSharedBtn}>
              {isEn ? "Edit on My Board" : "このボードを編集する"}
            </button>
          ) : (
            <button
              type="button"
              disabled={isCreatingRoom}
              onClick={handleCreateCollabRoom}
              className={styles.primaryBtn}
            >
              {isCreatingRoom
                ? isEn ? "Creating Link..." : "共有リンク発行中..."
                : isEn ? "Share Board to Collaborate" : "リンクを共有して一緒に貼る"}
            </button>
          )}
        </div>
      </header>

      {isCollabMode && (
        <div className={styles.collabBanner}>
          <div className={styles.collabBannerLeft}>
            <span className={styles.collabBadge}>
              {isEn ? "SHARED BOARD" : "共有中"}
            </span>
            <input
              type="text"
              value={collabTitleDraft}
              onChange={(e) => setCollabTitleDraft(e.target.value)}
              onBlur={handleSaveCollabTitle}
              aria-label="Board title"
              className={styles.collabTitleInput}
            />
            <span>
              {isEn
                ? "Anyone with this URL can pin polaroids from any scroll."
                : "このURLを共有すると、授業やグループで同じボードにポラロイドを貼れます"}
            </span>
            {roomError && <strong style={{ color: "#dc2626" }}>({roomError})</strong>}
          </div>
          <div className={styles.collabBannerRight}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span>{isEn ? "Your name:" : "あなたの名前:"}</span>
              <input
                type="text"
                maxLength={30}
                value={authorName}
                onChange={(e) => handleAuthorNameChange(e.target.value)}
                placeholder={isEn ? "e.g. Student A" : "例: 3年1組 田中"}
                className={styles.authorNameInput}
              />
            </label>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => loadCollabRoom(roomParam, true)}
              className={styles.collabMiniBtn}
            >
              {isRefreshing
                ? isEn ? "Refreshing..." : "更新中..."
                : refreshSuccess
                ? isEn ? "✓ Updated" : "✓ 更新完了"
                : isEn ? "Refresh" : "最新に更新"}
            </button>
          </div>
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
            {items.map((item) => {
              const th = THEMES[item.theme] || THEMES.white;
              const texUrl = getThemeTextureUrl(item.theme);
              const isSelected = activeId === item.id;

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handleCardPointerDown(e, item)}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                  onPointerCancel={handleCardPointerUp}
                  style={{
                    width: `${CARD_PHOTO_W + 24}px`,
                    zIndex: item.zIndex || 1,
                    transform: `translate3d(${item.boardX}px, ${item.boardY}px, 0) rotate(${item.rotate || 0}deg)`,
                    backgroundColor: th.bg,
                    backgroundImage: texUrl ? `url(${texUrl})` : "none",
                    border: th.border ? `1.5px solid ${th.border}` : "1px solid #e5e7eb",
                    color: th.titleColor,
                  }}
                  className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                >
                  {/* マスキングテープ風装飾 */}
                  <div className={styles.tape} />

                  {/* 削除ボタン */}
                  {(!isSharedMode && (!isCollabMode || item.canEdit !== false)) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      title={isEn ? "Remove" : "ボードから外す"}
                      className={styles.deleteBtn}
                    >
                      ×
                    </button>
                  )}

                  {/* 写真切り抜きプレビュー */}
                  <PolaroidCardPreview item={item} />

                  {/* 作品タイトル・章 */}
                  <div className={styles.captionBox}>
                    {item.displayChapter ? (
                      <p className={styles.chapterText} style={{ color: th.titleColor }}>
                        {item.displayChapter}
                      </p>
                    ) : null}
                    {item.displayTitle ? (
                      <p className={styles.titleText} style={{ color: th.subColor }}>
                        {isEn ? item.displayTitle : `『${item.displayTitle}』`}
                      </p>
                    ) : null}
                  </div>

                  {/* ひとこと・観察メモ（統一入力欄） */}
                  <div className={styles.memoBox}>
                    <textarea
                      rows={2}
                      maxLength={40}
                      value={item.message || item.memo || ""}
                      readOnly={isSharedMode || (isCollabMode && item.canEdit === false)}
                      onChange={(e) => handleMessageChange(item.id, e.target.value)}
                      placeholder={isEn ? "Add a caption / note..." : "ひとこと・観察メモを書き込む..."}
                      className={styles.memoInput}
                    />
                    {isCollabMode && (
                      <span className={styles.authorTag}>
                        by {item.authorName || (isEn ? "Anonymous" : "名無しの鑑賞者")}
                      </span>
                    )}
                  </div>

                  {/* 元の絵巻へ戻るリンク */}
                  {item.scrollId ? (
                    <div className={styles.cardFooter}>
                      <Link href={`/${item.scrollId}`} locale={router.locale} passHref>
                        <a className={styles.scrollLink} style={{ color: th.subColor }}>
                          {isEn ? "Source →" : "元の絵巻 →"}
                        </a>
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
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