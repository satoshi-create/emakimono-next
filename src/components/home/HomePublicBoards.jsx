import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { fetchCollabBoard, fetchPublicBoards } from "@/libs/api/ugcApi";
import {
  THEMES,
  PHOTO_DW,
  PHOTO_DH,
  getThemeTextureUrl,
} from "@/components/emaki/viewer/polaroid/polaroidCanvasRenderer";
import { buildSourceHref } from "@/components/emaki/viewer/board/polaroidBoardPolicy";
import { ERA_COLOR_MODES, VIEWER_SURFACE_TOKENS } from "@/theme/colorMode";

const CARD_PHOTO_W = 204;
const CARD_PHOTO_H = Math.round((CARD_PHOTO_W * PHOTO_DH) / PHOTO_DW);
const CARD_OUTER_W = CARD_PHOTO_W + 22;
const CARD_OUTER_H = CARD_PHOTO_H + 108;

function BoardCardPhoto({ item }) {
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
        position: "relative",
        width: `${CARD_PHOTO_W}px`,
        height: `${CARD_PHOTO_H}px`,
        overflow: "hidden",
        background: "#1f2937",
        borderRadius: 4,
      }}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.displayTitle || "Emaki Polaroid"}
          loading="lazy"
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

// 初期座標が未設定または重なっている場合に整列するフォールバック
function normalizeBoardItems(rawItems) {
  return rawItems.map((item, idx) => {
    const hasCoords =
      typeof item.boardX === "number" &&
      typeof item.boardY === "number" &&
      (item.boardX !== 0 || item.boardY !== 0);
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    return {
      ...item,
      boardX: hasCoords ? item.boardX : 40 + col * 255,
      boardY: hasCoords ? item.boardY : 40 + row * 285,
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
function getAddPlaceholderPos(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { x: 120, y: 40 };
  }
  let maxRight = -Infinity;
  let refY = 40;
  for (const item of items) {
    const x = Number(item.boardX) || 0;
    const y = Number(item.boardY) || 0;
    if (x + CARD_OUTER_W > maxRight) {
      maxRight = x + CARD_OUTER_W;
      refY = y;
    }
  }
  return { x: maxRight + 34, y: refY };
}

// カード群（点線プレースホルダー含む）が上部フローティングUIや左端に見切れずボード内に収まるビューポートを計算
function computeFittedViewport(items, containerW = 1280, containerH = 580) {
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
    if (x + CARD_OUTER_W > maxX) maxX = x + CARD_OUTER_W;
    if (y + CARD_OUTER_H > maxY) maxY = y + CARD_OUTER_H;
  }

  const padLeft = 40;
  const padRight = 40;
  const padTop = 114; // 上部コピー＆タブバーの高さ分の安全余白
  const padBottom = 56; // 下部コントロールバー分の安全余白

  const contentW = Math.max(CARD_OUTER_W, maxX - minX);
  const contentH = Math.max(CARD_OUTER_H, maxY - minY);
  const availW = Math.max(320, containerW - padLeft - padRight);
  const availH = Math.max(240, containerH - padTop - padBottom);

  const fitScale = Math.min(1, availW / contentW, availH / contentH);
  const scale = Math.round(Math.max(0.55, Math.min(1, fitScale)) * 100) / 100;

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

export default function HomePublicBoards({ surface: useSurface = true }) {
  const router = useRouter();
  const isEn = router.locale === "en";
  const sectionBg = useSurface
    ? "var(--clr-surface, #f9fbff)"
    : "var(--clr-bg, #ffffff)";

  const surface = VIEWER_SURFACE_TOKENS;
  const defaultTone = ERA_COLOR_MODES.default;
  const heianTone = ERA_COLOR_MODES.heian;

  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [itemsByBoardId, setItemsByBoardId] = useState({});
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [viewport, setViewport] = useState({ x: 48, y: 118, scale: 0.94 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [likedIds, setLikedIds] = useState({});
  const [showHowTo, setShowHowTo] = useState(false);

  const canvasRef = useRef(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const panRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const dragRef = useRef({
    active: false,
    cardId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const applyFitForItems = useCallback((items) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = rect?.width || (typeof window !== "undefined" ? window.innerWidth : 1280);
    const h = rect?.height || 580;
    setViewport(computeFittedViewport(items, w, h));
  }, []);

  // 1. 公開ボード一覧の取得と初期タブ選択
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

  // 2. 選択されたタブのボード詳細（カード一覧）を取得・キャッシュ・自動フィット（ボード切替時のみ）
  const fittedBoardIdRef = React.useRef(null);

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

  // 3. キャンバス上のマウスホイール（中ボタン）でカーソル中心に拡大・縮小
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

  const handleSelectTab = (boardId) => {
    setSelectedBoardId(boardId);
    setActiveCardId(null);
  };

  // 背景ドラッグ（ホワイトボードのパン移動）
  const handleCanvasPointerDown = (e) => {
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

  const handleJumpToScrolls = (e) => {
    e.stopPropagation();
    const sectionEl = e.currentTarget.closest("section");
    const nextSection = sectionEl?.nextElementSibling;
    if (nextSection && typeof nextSection.scrollIntoView === "function") {
      nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push("/gallery", undefined, { locale: router.locale });
  };
  const handleCanvasPointerMove = (e) => {
    if (!panRef.current.active) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setViewport((prev) => ({
      ...prev,
      x: panRef.current.origX + dx,
      y: panRef.current.origY + dy,
    }));
  };

  const handleCanvasPointerUp = (e) => {
    if (!panRef.current.active) return;
    panRef.current.active = false;
    setIsPanning(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // カードのドラッグ移動（ローカルお試し操作＆最前面化）
  const handleCardPointerDown = (e, item) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === "mouse") return;
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
    const dx = (e.clientX - dragRef.current.startX) / viewport.scale;
    const dy = (e.clientY - dragRef.current.startY) / viewport.scale;
    const nextX = Math.round(dragRef.current.origX + dx);
    const nextY = Math.round(dragRef.current.origY + dy);
    const targetId = dragRef.current.cardId;

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

  if (!isLoadingList && boards.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={
        isEn ? "Public Polaroid Whiteboard" : "みんなのポラロイド・ホワイトボード"
      }
      style={{
        position: "relative",
        width: "100%",
        height: "580px",
        margin: 0,
        overflow: "hidden",
        backgroundColor: sectionBg,
      }}
    >
      {/* 全面ホワイトボードキャンバス */}
      <div
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          touchAction: "none",
          cursor: isPanning ? "grabbing" : "grab",
          backgroundColor: sectionBg,
          backgroundImage: [
            "radial-gradient(rgba(71, 85, 105, 0.42) 1.6px, transparent 1.6px)",
            "radial-gradient(rgba(100, 116, 139, 0.28) 1.35px, transparent 1.35px)",
          ].join(", "),
          backgroundSize: `${120 * viewport.scale}px ${120 * viewport.scale}px, ${24 * viewport.scale}px ${24 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px, ${viewport.x}px ${viewport.y}px`,
          boxShadow:
            "inset 0 10px 18px -14px rgba(15, 23, 42, 0.18), inset 0 -10px 18px -14px rgba(15, 23, 42, 0.16)",
          userSelect: "none",
        }}
      >
        {isLoadingList || isLoadingItems ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: surface.barTextMuted,
            }}
          >
            {isEn
              ? "Loading polaroid whiteboard..."
              : "ホワイトボードを読み込み中..."}
          </div>
        ) : activeItems.length === 0 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 20,
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: surface.barTextMuted }}>
              {isEn
                ? "No polaroids pinned to this board yet."
                : "このホワイトボードにはまだカードが貼られていません。"}
            </p>
            {activeBoard && (
              <Link
                href={`/board?room=${encodeURIComponent(activeBoard.id)}`}
                locale={router.locale}
                passHref
              >
                <a
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "8px 18px",
                    borderRadius: 999,
                    background: defaultTone.accent,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  {isEn
                    ? "Open Board & Pin First Card →"
                    : "ボードを開いて最初の1枚を貼る →"}
                </a>
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: "0 0",
              transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
            }}
          >
            {activeItems.map((item) => {
              const th = THEMES[item.theme] || THEMES.white;
              const texUrl = getThemeTextureUrl(item.theme);
              const isSelected = activeCardId === item.id;
              const isLiked = Boolean(likedIds[item.id]);

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handleCardPointerDown(e, item)}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                  onPointerCancel={handleCardPointerUp}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${CARD_OUTER_W}px`,
                    zIndex: item.zIndex || 1,
                    transform: `translate3d(${item.boardX}px, ${item.boardY}px, 0) rotate(${item.rotate || 0}deg)`,
                    backgroundColor: th.bg || "#fff",
                    backgroundImage: texUrl ? `url(${texUrl})` : "none",
                    border: isSelected
                      ? `2px solid ${defaultTone.accent}`
                      : th.border
                      ? `1.5px solid ${th.border}`
                      : "1px solid rgba(0,0,0,0.14)",
                    borderRadius: 6,
                    padding: "11px 11px 12px",
                    boxShadow: isSelected
                      ? "0 16px 34px rgba(0, 0, 0, 0.18)"
                      : "0 6px 18px rgba(0, 0, 0, 0.1)",
                    cursor: "grab",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  {/* マスキングテープ風装飾 */}
                  <div
                    style={{
                      position: "absolute",
                      top: -9,
                      left: "50%",
                      transform: "translateX(-50%) rotate(-2deg)",
                      width: 56,
                      height: 16,
                      background: "rgba(255, 248, 220, 0.88)",
                      border: "1px solid rgba(138, 109, 59, 0.25)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  />

                  <BoardCardPhoto item={item} />

                  {/* 作品タイトル・段タイトル（/board の PolaroidBoardCard と統一） */}
                  <div
                    style={{
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    {item.displayChapter && (
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: th.titleColor || surface.barText,
                          lineHeight: 1.35,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.displayChapter}
                      </div>
                    )}
                    {item.displayTitle && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: th.subColor || surface.barTextMuted,
                          marginTop: item.displayChapter ? 2 : 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {isEn ? item.displayTitle : `『${item.displayTitle}』`}
                      </div>
                    )}
                  </div>

                  {(item.message || item.memo) && (
                    <div
                      style={{
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: "1px solid rgb(20 20 20 / 0.08)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: th.titleColor || surface.barText,
                          margin: 0,
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.message || item.memo}
                      </p>
                    </div>
                  )}

                  {/* 投稿者バッジ（/board の PolaroidBoardCard と統一） */}
                  <div style={{ marginTop: 6 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#92400e",
                        background: "#fef3c7",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      by{" "}
                      {item.authorName ||
                        (isEn ? "Anonymous" : "名無しの鑑賞者")}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: "1px dashed rgba(0,0,0,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleToggleLike(e, item.id)}
                      style={{
                        fontSize: 11,
                        padding: "2px 7px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,0,0,0.14)",
                        background: isLiked ? "#fef2f2" : "#fff",
                        color: isLiked ? "#dc2626" : "#374151",
                        cursor: "pointer",
                      }}
                    >
                      {isLiked ? "♥" : "♡"}{" "}
                      {(item.likeCount || 0) + (isLiked ? 1 : 0)}
                    </button>

                    {item.scrollId ? (
                      <Link
                        href={buildSourceHref(item)}
                        locale={router.locale}
                        passHref
                      >
                        <a
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            fontWeight: 700,
                            color: defaultTone.text,
                            textDecoration: "none",
                          }}
                        >
                          {isEn ? "Jump to Scene →" : "元絵巻・座標 →"}
                        </a>
                      </Link>
                    ) : (
                      <span style={{ color: surface.barTextMuted }}>
                        by {item.authorName || (isEn ? "Guest" : "鑑賞者")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ① ボード上の「＋ あなたの1枚を貼る」点線ポラロイドカード */}
            {(() => {
              const ph = getAddPlaceholderPos(activeItems);
              return (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${CARD_OUTER_W}px`,
                    minHeight: `${CARD_PHOTO_H + 92}px`,
                    zIndex: 1,
                    transform: `translate3d(${ph.x}px, ${ph.y}px, 0) rotate(1.4deg)`,
                    backgroundColor: "rgba(255, 255, 255, 0.72)",
                    border: `2px dashed ${defaultTone.border}`,
                    borderRadius: 8,
                    padding: "14px 13px 13px",
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  {/* マスキングテープ風装飾 */}
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
                      background: defaultTone.softBg,
                      padding: "12px 10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 4 }}>
                      📷
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: defaultTone.text,
                      }}
                    >
                      {isEn ? "+ Pin Your Scene" : "＋ あなたの1枚を貼る"}
                    </div>
                  </div>

                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 16,
                      fontSize: 11,
                      lineHeight: 1.55,
                      color: surface.barText,
                    }}
                  >
                    <li>
                      {isEn ? "Open any emaki scroll" : "好きな絵巻を開く"}
                    </li>
                    <li>
                      {isEn
                        ? "Tap the 📷 Polaroid button"
                        : "画面の 📷 ボタンを押す"}
                    </li>
                    <li>
                      {isEn
                        ? 'Choose "Pin to Board"'
                        : "「ボードに貼る」で追加！"}
                    </li>
                  </ol>

                  <button
                    type="button"
                    onClick={handleJumpToScrolls}
                    style={{
                      width: "100%",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "7px 10px",
                      borderRadius: 999,
                      border: "none",
                      background: defaultTone.accent,
                      color: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(138, 109, 59, 0.25)",
                    }}
                  >
                    {isEn
                      ? "Pick a Scroll to Clip →"
                      : "絵巻を選んで切り抜く →"}
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 上部フローティングバー（キャッチコピー ＋ テーマ切り替えタブ ＋ 最小限の導線） */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          right: 16,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {/* 1段目：キャッチコピーピル（＋貼り方ポップオーバー） ＋ アクションボタン */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ position: "relative", pointerEvents: "auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px 6px 14px",
                borderRadius: 999,
                background: "rgba(255, 252, 246, 0.95)",
                backdropFilter: "blur(6px)",
                border: `1px solid ${surface.barBorder}`,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.07)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: heianTone.softBg,
                  color: heianTone.text,
                  border: `1px solid ${heianTone.border}`,
                }}
              >
                {isEn ? "POLAROID BOARD" : "ポラロイド・ボード"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: surface.barText,
                }}
              >
                {isEn
                  ? "Clip & Share Your Favorite Emaki Scenes"
                  : "絵巻の気になる場面を切り抜いて、みんなで共有しよう"}
              </span>
              <button
                type="button"
                aria-expanded={showHowTo}
                onClick={() => setShowHowTo((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${defaultTone.border}`,
                  background: showHowTo ? defaultTone.accent : defaultTone.softBg,
                  color: showHowTo ? "#ffffff" : defaultTone.text,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span aria-hidden="true">📷</span>
                <span>{isEn ? "How to Pin" : "貼り方"}</span>
              </button>
            </div>

            {showHowTo && (
              <div
                role="dialog"
                aria-label={isEn ? "How to pin a polaroid" : "ポラロイドの貼り方ガイド"}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  zIndex: 60,
                  width: "min(360px, calc(100vw - 32px))",
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(255, 252, 246, 0.98)",
                  border: `1.5px solid ${defaultTone.border}`,
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: 13, color: defaultTone.text }}>
                    {isEn
                      ? "3 Easy Steps to Pin Your Discovery"
                      : "かんたん3ステップでボードに貼れます"}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowHowTo(false)}
                    aria-label="Close guide"
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 14,
                      fontWeight: 700,
                      color: surface.barTextMuted,
                      cursor: "pointer",
                      padding: "0 4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12,
                    lineHeight: 1.65,
                    color: surface.barText,
                  }}
                >
                  <li>
                    {isEn
                      ? "Open any scroll viewer and zoom into an interesting detail."
                      : "好きな絵巻ビューアを開き、気になる場面を拡大します。"}
                  </li>
                  <li>
                    {isEn
                      ? "Click the 📷 camera icon at the bottom-right to snap a Polaroid."
                      : "画面右下の 📷 カメラボタンを押してポラロイド風に切り抜きます。"}
                  </li>
                  <li>
                    {isEn
                      ? 'Add a note, tap "Pin to Board", and publish it to any public theme!'
                      : "メモを添えて「ボードに貼る」を押し、公開ボードへ投稿すれば完了です。"}
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 6px",
              borderRadius: 999,
              background: "rgba(255, 252, 246, 0.94)",
              backdropFilter: "blur(6px)",
              border: `1px solid ${surface.barBorder}`,
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.07)",
              pointerEvents: "auto",
            }}
          >
            {activeBoard && (
              <Link
                href={`/board?room=${encodeURIComponent(activeBoard.id)}`}
                locale={router.locale}
                passHref
              >
                <a
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "5px 13px",
                    borderRadius: 999,
                    background: defaultTone.accent,
                    color: "#ffffff",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isEn ? "Join Board →" : "このボードを開く →"}
                </a>
              </Link>
            )}
            <Link href="/board/public" locale={router.locale} passHref>
              <a
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 11px",
                  borderRadius: 999,
                  color: defaultTone.text,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {isEn ? "All Boards" : "公開一覧"}
              </a>
            </Link>
          </div>
        </div>

        {/* 2段目：テーマ切り替えタブ */}
        {!isLoadingList && boards.length > 0 && (
          <div>
            <div
              role="tablist"
              aria-label={
                isEn ? "Public board themes" : "公開ボードのテーマ切り替え"
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                maxWidth: "100%",
                overflowX: "auto",
                padding: "4px 6px",
                borderRadius: 999,
                background: "rgba(255, 252, 246, 0.92)",
                backdropFilter: "blur(6px)",
                border: `1px solid ${surface.barBorder}`,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
                pointerEvents: "auto",
              }}
            >
              {boards.map((b) => {
                const isSelected = activeBoard?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSelectTab(b.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      padding: "5px 12px",
                      borderRadius: 999,
                      border: "none",
                      background: isSelected ? defaultTone.accent : "transparent",
                      color: isSelected ? "#ffffff" : surface.barText,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{b.title}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: isSelected
                          ? "rgba(255, 255, 255, 0.24)"
                          : defaultTone.softBg,
                        color: isSelected ? "#ffffff" : defaultTone.text,
                      }}
                    >
                      {b.itemCount || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 左下：操作ヒント */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 16,
          bottom: 14,
          zIndex: 40,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          padding: "7px 14px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.96)",
          color: defaultTone.text,
          border: `1.5px solid ${defaultTone.border}`,
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.1)",
          pointerEvents: "none",
        }}
      >
        <span aria-hidden="true">✋</span>
        <span>
          {isEn
            ? "Interactive Board: Drag cards or background • Scroll to zoom"
            : "触れるボード：カードや背景をドラッグ・ホイールで拡大縮小"}
        </span>
      </div>

      {/* 右下：ズームコントロール */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          right: 16,
          bottom: 14,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 6px",
          borderRadius: 999,
          background: "rgba(255, 252, 246, 0.95)",
          border: `1px solid ${surface.barBorder}`,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <button
          type="button"
          onClick={() => zoomBy(-0.15)}
          aria-label="Zoom out"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            fontWeight: 700,
            cursor: "pointer",
            color: surface.barText,
          }}
        >
          −
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            minWidth: 40,
            textAlign: "center",
            color: surface.barText,
          }}
        >
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(0.15)}
          aria-label="Zoom in"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            fontWeight: 700,
            cursor: "pointer",
            color: surface.barText,
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => applyFitForItems(activeItems)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 999,
            border: `1px solid ${surface.barBorder}`,
            background: surface.barSurfaceSolid,
            color: defaultTone.text,
            cursor: "pointer",
          }}
        >
          {isEn ? "Reset" : "リセット"}
        </button>
      </div>
    </section>
  );
}
