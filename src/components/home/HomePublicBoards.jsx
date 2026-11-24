import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  THEMES,
  PHOTO_DW,
  getThemeTextureUrl,
} from "@/components/emaki/viewer/polaroid/polaroidCanvasRenderer";
import { buildSourceHref } from "@/components/emaki/viewer/board/polaroidBoardPolicy";
import { PolaroidCardView } from "@/components/emaki/viewer/board/PolaroidCardView";
import { ERA_COLOR_MODES, VIEWER_SURFACE_TOKENS } from "@/theme/colorMode";
import {
  HOME_CARD_PHOTO_W,
  HOME_CARD_PHOTO_H,
  HOME_CARD_OUTER_W,
  HOME_CARD_OUTER_H,
  getAddPlaceholderPos,
  useHomePublicBoards,
} from "./useHomePublicBoards";

const CARD_PHOTO_W = HOME_CARD_PHOTO_W;
const CARD_PHOTO_H = HOME_CARD_PHOTO_H;
const CARD_OUTER_W = HOME_CARD_OUTER_W;
const CARD_OUTER_H = HOME_CARD_OUTER_H;

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

export default function HomePublicBoards({ surface: useSurface = true }) {
  const router = useRouter();
  const isEn = router.locale === "en";
  const sectionBg = useSurface
    ? "var(--clr-surface, #f9fbff)"
    : "var(--clr-bg, #ffffff)";

  const surface = VIEWER_SURFACE_TOKENS;
  const defaultTone = ERA_COLOR_MODES.default;
  const heianTone = ERA_COLOR_MODES.heian;

  const {
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
  } = useHomePublicBoards({ router, isEn });

  if (!isLoadingList && boards.length === 0) {
    return null;
  }

  return (
    <>
      {!isFullscreen && !isLoadingList && boards.length > 0 && (
        <div
          role="tablist"
          aria-label={isEn ? "Public board tabs" : "公開ボード切り替えタブ"}
          style={{
            width: "100%",
            padding: "10px 16px 0",
            backgroundColor: "#eef2f6",
            borderBottom: `1px solid ${surface.barBorder}`,
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {boards.map((b) => {
            const isActive = b.id === activeBoard?.id;
            return (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectTab(b.id)}
                style={{
                  position: "relative",
                  bottom: -1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? "#0f172a" : "#475569",
                  backgroundColor: isActive ? sectionBg : "rgba(255, 255, 255, 0.65)",
                  borderTop: isActive
                    ? `1.5px solid ${surface.barBorder}`
                    : "1px solid rgba(203, 213, 225, 0.85)",
                  borderLeft: isActive
                    ? `1.5px solid ${surface.barBorder}`
                    : "1px solid rgba(203, 213, 225, 0.85)",
                  borderRight: isActive
                    ? `1.5px solid ${surface.barBorder}`
                    : "1px solid rgba(203, 213, 225, 0.85)",
                  borderBottom: isActive
                    ? `2px solid ${sectionBg}`
                    : `1px solid ${surface.barBorder}`,
                  borderRadius: "10px 10px 0 0",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 13, color: "#0284c7" }}>
                  🌐
                </span>
                <span>{b.title}</span>
              </button>
            );
          })}
        </div>
      )}

      <section
        aria-label={
          isEn ? "Public Polaroid Whiteboard" : "みんなのポラロイド・ホワイトボード"
        }
      style={
        isFullscreen
          ? {
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 1300,
              margin: 0,
              overflow: "hidden",
              overscrollBehavior: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              backgroundColor: sectionBg,
            }
          : {
              position: "relative",
              width: "100%",
              height: "560px",
              margin: 0,
              overflow: "hidden",
              overscrollBehavior: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              backgroundColor: sectionBg,
            }
      }
    >
      {/* 全面ホワイトボードキャンバス */}
      <div
        ref={canvasRef}
        onDragStart={(e) => e.preventDefault()}
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
          overscrollBehavior: "none",
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
          WebkitUserSelect: "none",
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
                <PolaroidCardView
                  key={item.id}
                  item={item}
                  onPointerDown={(e) => handleCardPointerDown(e, item)}
                  onPointerMove={handleCardPointerMove}
                  onPointerUp={handleCardPointerUp}
                  isEn={isEn}
                  locale={router.locale}
                  isCollabMode={true}
                  isLiked={isLiked}
                  displayLikeCount={(item.likeCount || 0) + (isLiked ? 1 : 0)}
                  sourceHref={item.scrollId ? buildSourceHref(item) : ""}
                  onToggleLike={handleToggleLike}
                  renderPhoto={() => <BoardCardPhoto item={item} />}
                  theme={{
                    bg: th.bg || "#fff",
                    textureUrl: texUrl,
                    titleColor: th.titleColor || surface.barText,
                    subColor: th.subColor || surface.barTextMuted,
                    linkColor: defaultTone.text,
                    border: isSelected
                      ? `2px solid ${defaultTone.accent}`
                      : th.border
                      ? `1.5px solid ${th.border}`
                      : "1px solid rgba(0,0,0,0.14)",
                  }}
                  cardStyle={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${CARD_OUTER_W}px`,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    zIndex: item.zIndex || 1,
                    transform: `translate3d(${item.boardX}px, ${item.boardY}px, 0) rotate(${item.rotate || 0}deg)`,
                    borderRadius: 6,
                    padding: "11px 11px 12px",
                    boxShadow: isSelected
                      ? "0 16px 34px rgba(0, 0, 0, 0.18)"
                      : "0 6px 18px rgba(0, 0, 0, 0.1)",
                    cursor: "grab",
                    transition: "box-shadow 0.15s ease",
                  }}
                />
              );
            })}

          </div>
        )}
      </div>

      {/* 上部フローティングバー（1段目：現在のお題見出し ＋ 全画面ボタン / 2段目：ボード切替 ＋ このボードを開く） */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          right: 20,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {/* 1段目：現在のお題をピル枠なしのタイポグラフィ見出しで大きく表示 ＋ 全画面ボタン */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {(() => {
            const rawDesc = String(activeBoard?.description || "");
            let odaiPrompt = "";
            const odaiMatch = rawDesc.match(/<!--\s*odai:(\{[\s\S]*?\})\s*-->/i);
            if (odaiMatch) {
              try {
                const parsed = JSON.parse(odaiMatch[1]);
                if (parsed && typeof parsed.prompt === "string") {
                  odaiPrompt = parsed.prompt.trim();
                }
              } catch {}
            }
            const cleanedDesc = rawDesc
              .replace(/<!--[\s\S]*?-->/g, "")
              .replace(/\[hubs?:[^\]]*\]/gi, "")
              .replace(/#[^\s#]+/g, "")
              .trim();
            const boardTitle = String(activeBoard?.title || "").trim();
            const mainMission = odaiPrompt || cleanedDesc || boardTitle;
            if (!mainMission) return <div />;

            return (
              <div
                style={{
                  pointerEvents: "auto",
                  borderLeft: `4px solid ${defaultTone.accent}`,
                  paddingLeft: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  textShadow:
                    "0 1px 12px rgba(255, 252, 246, 0.98), 0 0 3px rgba(255, 252, 246, 0.95)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: defaultTone.accent,
                    letterSpacing: "0.08em",
                  }}
                >
                  {isEn ? "CURRENT THEME" : "今回のお題"}
                </span>
                <div
                  style={{
                    fontSize: "clamp(18px, 2.2vw, 24px)",
                    fontWeight: 900,
                    color: surface.barText,
                    lineHeight: 1.3,
                    letterSpacing: "0.01em",
                  }}
                >
                  「{mainMission}」
                </div>
              </div>
            );
          })()}

          <button
            type="button"
            aria-pressed={isFullscreen}
            onClick={() => setIsFullscreen((prev) => !prev)}
            style={{
              pointerEvents: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              padding: "7px 14px",
              borderRadius: 999,
              border: `1.5px solid ${isFullscreen ? "#0f172a" : defaultTone.border}`,
              background: isFullscreen ? "#0f172a" : "rgba(255, 252, 246, 0.96)",
              color: isFullscreen ? "#ffffff" : defaultTone.text,
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.1)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true">{isFullscreen ? "✕" : "⛶"}</span>
            <span>
              {isFullscreen
                ? isEn
                  ? "Exit Fullscreen (ESC)"
                  : "全画面を閉じる (ESC)"
                : isEn
                ? "Fullscreen Board"
                : "全画面で広げる"}
            </span>
          </button>
        </div>

        {/* 2段目：このボードを開くボタン（プルダウン削除済み） */}
        {!isLoadingList && activeBoard && (
          <div>
            <div
              style={{
                pointerEvents: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Link
                href={`/board?room=${encodeURIComponent(activeBoard.id)}`}
                locale={router.locale}
                passHref
              >
                <a
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: defaultTone.accent,
                    color: "#ffffff",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(138, 109, 59, 0.25)",
                  }}
                >
                  {isEn ? "Open Full Board →" : "このボードを開く →"}
                </a>
              </Link>
              <button
                type="button"
                onClick={handleJumpToScrolls}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: `1px solid ${defaultTone.border}`,
                  background: "#ffffff",
                  color: defaultTone.text,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {isEn
                  ? "Explore Scrolls for This Theme →"
                  : "お題に合う絵巻を探す →"}
              </button>
            </div>
            {relatedHubs.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  maxWidth: "100%",
                  pointerEvents: "auto",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: surface.barTextMuted,
                  }}
                >
                  {isEn ? "Related hubs" : "関連ハブ"}
                </span>
                {relatedHubs.map((hub) => (
                  <Link
                    key={hub.slug}
                    href={hub.path}
                    locale={router.locale}
                    passHref
                  >
                    <a
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isEn
                        ? hub.titleEn || hub.titleJa
                        : hub.titleJa || hub.titleEn}
                    </a>
                  </Link>
                ))}
              </div>
            )}
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
    </>
  );
}
