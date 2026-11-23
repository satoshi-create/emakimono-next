import React, { useState } from "react";
import Link from "next/link";
import styles from "./PolaroidBoardView.module.css";
import {
  THEMES,
  FORMATS,
  PHOTO_DW,
  PHOTO_DH,
  getThemeTextureUrl,
  getSenmenFanGeometry,
} from "../polaroid/polaroidCanvasRenderer";
import { getBoardCardPermissions } from "./polaroidBoardPolicy";

const CARD_PHOTO_W = 216;
const CARD_PHOTO_H = Math.round((CARD_PHOTO_W * PHOTO_DH) / PHOTO_DW); // 168px (720:560比率)
const SENMEN_CARD_PHOTO_W = 264;
const SENMEN_CARD_PHOTO_H = Math.round(
  (SENMEN_CARD_PHOTO_W * FORMATS.senmen.photoDh) / FORMATS.senmen.photoDw
); // 144px (880:480比率)

function parseCardThemeAndMode(rawTheme) {
  const str = String(rawTheme || "white");
  if (str.endsWith(":senmen")) {
    return { themeId: str.slice(0, -":senmen".length) || "white", isSenmen: true };
  }
  return { themeId: str, isSenmen: false };
}

function PolaroidCardPreview({ item, isSenmen, cardBg }) {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const boxW = isSenmen ? SENMEN_CARD_PHOTO_W : CARD_PHOTO_W;
  const boxH = isSenmen ? SENMEN_CARD_PHOTO_H : CARD_PHOTO_H;
    const r = boxW / PHOTO_DW;
    const cs = item.coverScale || 1;
    const z = item.zoom || 1.5;

    const minCoverScale =
      imgSize.w && imgSize.h ? Math.max(boxW / imgSize.w, boxH / imgSize.h) : 0;
    const rawDw = imgSize.w ? imgSize.w * cs * z * r : 0;
    const rawDh = imgSize.h ? imgSize.h * cs * z * r : 0;
    const dw = imgSize.w ? Math.max(rawDw, imgSize.w * minCoverScale) : 0;
    const dh = imgSize.h ? Math.max(rawDh, imgSize.h * minCoverScale) : 0;

    const maxPanX = dw > boxW ? (dw - boxW) / 2 : 0;
    const maxPanY = dh > boxH ? (dh - boxH) / 2 : 0;
    const rawTx = (item.pan?.x || 0) * r;
    const rawTy = (item.pan?.y || 0) * r;
    const tx = Math.max(-maxPanX, Math.min(maxPanX, rawTx));
    const ty = Math.max(-maxPanY, Math.min(maxPanY, rawTy));

  const senmenW = FORMATS.senmen.photoDw;
  const senmenH = FORMATS.senmen.photoDh;
  const fanGeom = isSenmen ? getSenmenFanGeometry(0, 0, senmenW, senmenH) : null;
  const fanPathD = fanGeom
    ? (() => {
        const { pivotX, pivotY, outerR, innerR, startAngle, endAngle } = fanGeom;
        const ox1 = pivotX + Math.cos(startAngle) * outerR;
        const oy1 = pivotY + Math.sin(startAngle) * outerR;
        const ox2 = pivotX + Math.cos(endAngle) * outerR;
        const oy2 = pivotY + Math.sin(endAngle) * outerR;
        const ix2 = pivotX + Math.cos(endAngle) * innerR;
        const iy2 = pivotY + Math.sin(endAngle) * innerR;
        const ix1 = pivotX + Math.cos(startAngle) * innerR;
        const iy1 = pivotY + Math.sin(startAngle) * innerR;
        return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 0 0 ${ix1} ${iy1} Z`;
      })()
    : "";

  return (
    <div
      style={{
        position: "relative",
        width: `${boxW}px`,
        height: `${boxH}px`,
        ...(isSenmen ? { background: "transparent", border: "none", boxShadow: "none" } : {}),
      }}
      className={styles.photoBox}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.displayTitle || "Emaki Polaroid"}
            draggable={false}
            decoding="async"
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
                    transform: `translate3d(calc(-50% + ${tx}px), calc(-50% + ${ty}px), 0)`,
                    backfaceVisibility: "hidden",
                }
              : {
                  width: "100%",
                  height: "100%",
                    objectFit: "cover",
                  }
          }
        />
      ) : null}
      {isSenmen && fanGeom ? (
        <svg
          viewBox={`0 0 ${senmenW} ${senmenH}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <path
            d={`M 0 0 H ${senmenW} V ${senmenH} H 0 Z ${fanPathD}`}
            fillRule="evenodd"
            fill={cardBg || "#ffffff"}
          />
          {Array.from({ length: 11 }, (_, i) => {
            const ang =
              fanGeom.startAngle +
              ((fanGeom.endAngle - fanGeom.startAngle) * i) / 10;
            const isOuterBone = i === 0 || i === 10;
            const boneEndR = fanGeom.innerR * 0.42;
            const x1 = fanGeom.pivotX + Math.cos(ang) * boneEndR;
            const y1 = fanGeom.pivotY + Math.sin(ang) * boneEndR;
            const x2 = fanGeom.pivotX + Math.cos(ang) * fanGeom.innerR;
            const y2 = fanGeom.pivotY + Math.sin(ang) * fanGeom.innerR;
            return (
              <g key={`board-rib-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isOuterBone ? "#3a2c1e" : "rgba(158, 122, 68, 0.55)"}
                  strokeWidth={isOuterBone ? 6 : 1.8}
                  strokeLinecap="round"
                />
                {isOuterBone ? (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(218, 182, 108, 0.65)"
                    strokeWidth="1.4"
                  />
                ) : null}
              </g>
            );
          })}
          <circle
            cx={fanGeom.pivotX}
            cy={fanGeom.pivotY - fanGeom.innerR * 0.46}
            r="5"
            fill="#d4af5a"
            stroke="#5c431d"
            strokeWidth="1.4"
          />
          <path d={fanPathD} fill="none" stroke="#c99e44" strokeWidth="4.5" />
          <path d={fanPathD} fill="none" stroke="#f0d78c" strokeWidth="1.5" />
        </svg>
      ) : null}
    </div>
  );
}

export const PolaroidBoardCard = React.memo(function PolaroidBoardCard({
  item,
  ruleBadge = null,
  isSelected,
  isEn,
  locale,
  isSharedMode,
  isCollabMode,
  isLiked,
  isCopied,
  sourceHref,
  isPublishingOpen,
  publicBoards,
  selectedPublicBoardId,
  isPublishingCard,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDelete,
  onMessageChange,
  onToggleLike,
  onShareCard,
  onOpenPublishPicker,
  onSelectPublicBoardId,
  onPublishCard,
}) {
  const { themeId, isSenmen: isSenmenTheme } = parseCardThemeAndMode(item.theme);
  const isSenmen = item.layout === "senmen" || isSenmenTheme;
  const th = THEMES[themeId] || THEMES.white;
  const texUrl = getThemeTextureUrl(themeId);
  const activePhotoW = isSenmen ? SENMEN_CARD_PHOTO_W : CARD_PHOTO_W;
  const cardPerms = getBoardCardPermissions({ isCollabMode, isSharedMode }, item);
  const displayLikeCount = isCollabMode
    ? Math.max(0, Number(item.likeCount) || 0)
    : isLiked
    ? 1
    : 0;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        width: `${activePhotoW + 24}px`,
        zIndex: item.zIndex || 1,
        transform: `translate3d(${Math.round(Number(item.boardX) || 0)}px, ${Math.round(Number(item.boardY) || 0)}px, 0) rotate(${item.rotate || 0}deg)`,
        backgroundColor: th.bg,
        backgroundImage: texUrl ? `url(${texUrl})` : "none",
        border: isSenmen
          ? "1.5px solid #c99e44"
          : th.border
            ? `1.5px solid ${th.border}`
            : "1px solid #e5e7eb",
        color: th.titleColor,
      }}
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
    >
      {/* マスキングテープ風装飾 */}
      <div className={styles.tape} />

      {/* 削除ボタン */}
      {cardPerms.canDelete && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          title={isEn ? "Remove" : "ボードから外す"}
          className={styles.deleteBtn}
        >
          ×
        </button>
      )}

      {ruleBadge && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            zIndex: 5,
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 800,
            background: ruleBadge.bg,
            color: ruleBadge.color,
            border: `1px solid ${ruleBadge.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            pointerEvents: "none",
          }}
        >
          {ruleBadge.label}
        </div>
      )}

      {/* 写真切り抜きプレビュー */}
      <PolaroidCardPreview item={item} isSenmen={isSenmen} cardBg={th.bg} />

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
          readOnly={!cardPerms.canEditMemo}
          onChange={(e) => onMessageChange(item.id, e.target.value)}
          placeholder={
            isCollabMode
              ? isEn
                ? "Write a verse or witty caption for this prompt..."
                : "お題への一句・一言見立てを詠む..."
              : isEn
              ? "Add a caption / note..."
              : "ひとこと・観察メモを書き込む..."
          }
          className={styles.memoInput}
        />
        {isCollabMode && (
          <span className={styles.authorTag}>
            {isEn ? "by" : "詠み人:"}{" "}
            {item.authorName || (isEn ? "Anonymous" : "名無しの鑑賞者")}
          </span>
        )}
      </div>

      {/* いいね・共有・元の絵巻＆座標リンク */}
      <div
        className={styles.cardFooter}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => onToggleLike(e, item.id)}
            title={isCollabMode ? (isEn ? "Like this post" : "この投稿にいいね！する") : undefined}
            style={{
              fontSize: 11,
              fontWeight: isCollabMode ? 600 : 400,
              padding: "2px 8px",
              borderRadius: 999,
              border: isCollabMode
                ? isLiked
                  ? "1px solid #f59e0b"
                  : "1px solid #e5e7eb"
                : "1px solid #e5e7eb",
              background: isCollabMode
                ? isLiked
                  ? "#fef3c7"
                  : "#fff"
                : isLiked
                ? "#fef2f2"
                : "#fff",
              color: isCollabMode
                ? isLiked
                  ? "#b45309"
                  : "#374151"
                : isLiked
                ? "#dc2626"
                : "#374151",
              cursor: "pointer",
            }}
          >
            {isCollabMode ? (isLiked ? "👏 いいね！" : "👏 いいね") : isLiked ? "♥" : "♡"}{" "}
            {displayLikeCount}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => onShareCard(e, item)}
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            {isCopied ? (isEn ? "Copied" : "コピー済") : isEn ? "Share" : "共有"}
          </button>
        </div>
        {item.scrollId ? (
          <Link href={sourceHref} locale={locale} passHref>
            <a
              onPointerDown={(e) => e.stopPropagation()}
              className={styles.scrollLink}
              style={{ color: th.subColor }}
            >
              {isEn ? "Scene & Scroll →" : "元絵巻・座標 →"}
            </a>
          </Link>
        ) : null}
      </div>

      {!isCollabMode && !isSharedMode && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px dashed #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {process.env.NODE_ENV === "development" && (
            <>
          <button
            type="button"
            onClick={(e) => onOpenPublishPicker(e, item.id)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #a7f3d0",
              background: "#ecfdf5",
              color: "#047857",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {isPublishingOpen
              ? isEn
                ? "Close"
                : "閉じる"
              : isEn
              ? "Post to Public Board"
              : "公開ボードに投稿する"}
          </button>

          {isPublishingOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {publicBoards.length === 0 ? (
                <Link href="/board/public" locale={locale} passHref>
                  <a style={{ fontSize: 11, color: "#047857" }}>
                    {isEn
                      ? "No public boards yet. Create one →"
                      : "公開ボードがまだありません（一覧で作成 →）"}
                  </a>
                </Link>
              ) : (
                <>
                  <select
                    value={selectedPublicBoardId}
                    onChange={(e) => onSelectPublicBoardId(e.target.value)}
                    style={{
                      fontSize: 11,
                      padding: "4px 6px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                    }}
                  >
                    {publicBoards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isPublishingCard}
                    onClick={(e) => onPublishCard(e, item)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "none",
                      background: "#059669",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {isPublishingCard
                      ? isEn
                        ? "Posting..."
                        : "投稿中..."
                      : isEn
                      ? "Confirm & Post"
                      : "この公開ボードへ投稿"}
                  </button>
                </>
              )}
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  );
});
