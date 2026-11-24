import React from "react";
import Link from "next/link";

// =============================================================================
// 1. 共通ポラロイドカード描画（トップページ・個人/公開ボード共通ビュー）
// =============================================================================
// なぜ分離するか:
// HomePublicBoards.jsx と PolaroidBoardCard.jsx で同一デザインのカードJSXが重複し、
// スタイル不整合が発生していたため、純粋な表示責務を本コンポーネントへ集約する。

export const PolaroidCardView = React.memo(function PolaroidCardView({
  item,
  isEn = false,
  locale = "ja",
  theme = {},
  isCollabMode = false,
  isLiked = false,
  displayLikeCount = 0,
  sourceHref = "",
  canEditMemo = false,
  onMessageChange,
  onToggleLike,
  renderPhoto,
  topLeftSlot = null,
  topRightSlot = null,
  bottomExtraSlot = null,
  cardStyle = {},
  cardClassName = "",
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const titleColor = theme.titleColor || "#1c1917";
  const subColor = theme.subColor || "#57534e";
  const linkColor = theme.linkColor || "#78350f";

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cardClassName}
      style={{
        backgroundColor: theme.bg || "#ffffff",
        backgroundImage: theme.textureUrl ? `url(${theme.textureUrl})` : "none",
        border: theme.border || "1.5px solid #8a6d3b",
        borderRadius: 10,
        padding: "10px 10px 12px",
        boxShadow: "0 4px 12px rgba(28, 25, 23, 0.10)",
        color: titleColor,
        boxSizing: "border-box",
        ...cardStyle,
      }}
    >
      {/* マスキングテープ風装飾 */}
      <div
        aria-hidden="true"
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
          pointerEvents: "none",
        }}
      />

      {topLeftSlot}
      {topRightSlot}

      {/* 写真切り抜きプレビュー領域（呼び出し元から注入） */}
      {typeof renderPhoto === "function" ? renderPhoto() : null}

      {/* 作品タイトル・段タイトル */}
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {item.displayChapter ? (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: titleColor,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.displayChapter}
          </div>
        ) : null}
        {item.displayTitle ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: subColor,
              marginTop: item.displayChapter ? 2 : 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isEn ? item.displayTitle : `『${item.displayTitle}』`}
          </div>
        ) : null}
      </div>

      {/* ひとこと・観察メモ（編集可なら textarea、閲覧のみならテキスト表示） */}
      {(canEditMemo || item.message || item.memo) && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px solid rgba(20, 20, 20, 0.08)",
          }}
        >
          {canEditMemo ? (
            <textarea
              rows={2}
              maxLength={40}
              value={item.message || item.memo || ""}
              onPointerDown={(e) => e.stopPropagation()}
              onChange={(e) => onMessageChange && onMessageChange(item.id, e.target.value)}
              placeholder={
                isCollabMode
                  ? isEn
                    ? "Write a verse or witty caption..."
                    : "お題への一句・一言見立てを詠む..."
                  : isEn
                  ? "Add a caption / note..."
                  : "ひとこと・観察メモを書き込む..."
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 12,
                lineHeight: 1.45,
                color: titleColor,
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(138, 109, 59, 0.35)",
                borderRadius: 6,
                padding: "4px 6px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          ) : (
            <p
              style={{
                fontSize: 12,
                color: titleColor,
                margin: 0,
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {item.message || item.memo}
            </p>
          )}
        </div>
      )}

      {/* 投稿者バッジ */}
      {isCollabMode && (
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
            by {item.authorName || (isEn ? "Anonymous" : "名無しの鑑賞者")}
          </span>
        </div>
      )}

      {/* フッター：いいねボタン ＆ 元絵巻・座標リンク */}
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
          onClick={(e) => onToggleLike && onToggleLike(e, item.id)}
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
          {isLiked ? "♥" : "♡"} {displayLikeCount}
        </button>

        {sourceHref ? (
          <Link href={sourceHref} locale={locale} passHref>
            <a
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                fontWeight: 700,
                color: linkColor,
                textDecoration: "none",
              }}
            >
              {isEn ? "Jump to Scene →" : "元絵巻・座標 →"}
            </a>
          </Link>
        ) : null}
      </div>

      {bottomExtraSlot}
    </div>
  );
});