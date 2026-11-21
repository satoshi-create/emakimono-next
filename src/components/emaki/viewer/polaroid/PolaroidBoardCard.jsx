import React, { useState } from "react";
import Link from "next/link";
import styles from "./PolaroidBoardView.module.css";
import {
  THEMES,
  PHOTO_DW,
  PHOTO_DH,
  getThemeTextureUrl,
} from "./polaroidCanvasRenderer";

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

export function PolaroidBoardCard({
  item,
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
  const th = THEMES[item.theme] || THEMES.white;
  const texUrl = getThemeTextureUrl(item.theme);

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, item)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
      {!isSharedMode && (!isCollabMode || item.canEdit !== false) && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
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
            title={isCollabMode ? (isEn ? "Vote / Applaud" : "お見事！（判を入れる）") : undefined}
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
            {isCollabMode ? (isLiked ? "👏 判" : "👏") : isLiked ? "♥" : "♡"}{" "}
            {(item.likeCount || 0) + (isLiked ? 1 : 0)}
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
}
