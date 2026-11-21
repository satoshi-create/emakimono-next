import React from "react";
import Link from "next/link";
import styles from "./PolaroidBoardView.module.css";
import { resolveRelatedThemeHub } from "./polaroidBoardHelpers";

export function PolaroidBoardHeader({
  isEn,
  locale,
  isCollabMode,
  isSharedMode,
  collabBoard,
  collabTitleDraft,
  setCollabTitleDraft,
  onSaveCollabTitle,
  onSaveCollabDescription,
  onCopyCollabInviteUrl,
  onNavigatePublicBoards,
  onNavigatePersonalBoard,
  onSaveSharedToMyBoard,
  isCreatingRoom,
  onCreateCollabRoom,
  roomError,
  authorName,
  onAuthorNameChange,
  isRefreshing,
  refreshSuccess,
  onRefreshRoom,
}) {
  const relatedHub = isCollabMode
    ? resolveRelatedThemeHub(
        `${collabBoard?.title || ""} ${collabBoard?.description || ""}`
      )
    : null;

  return (
    <>
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

        <div
          className={styles.headerRight}
          style={{ flexWrap: "nowrap", gap: 8, alignItems: "center" }}
        >
          {isCollabMode ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background:
                    collabBoard?.visibility === "public" ? "#ecfdf5" : "#fffbeb",
                  color:
                    collabBoard?.visibility === "public" ? "#047857" : "#b45309",
                  border:
                    collabBoard?.visibility === "public"
                      ? "1px solid #a7f3d0"
                      : "1px solid #fde68a",
                }}
              >
                {collabBoard?.visibility === "public"
                  ? isEn
                    ? "Public Board"
                    : "公開ボード"
                  : isEn
                  ? "Unlisted Shared"
                  : "限定共有ボード"}
              </span>
              <input
                type="text"
                value={collabTitleDraft}
                onChange={(e) => setCollabTitleDraft(e.target.value)}
                onBlur={onSaveCollabTitle}
                aria-label="Board title"
                className={styles.collabTitleInput}
                style={{ maxWidth: 180 }}
              />
              <button
                type="button"
                onClick={onCopyCollabInviteUrl}
                className={styles.primaryBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Copy Link" : "共有URLコピー"}
              </button>
              <button
                type="button"
                onClick={onNavigatePublicBoards}
                className={styles.collabMiniBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Public List" : "公開一覧"}
              </button>
              <button
                type="button"
                onClick={onNavigatePersonalBoard}
                className={styles.collabMiniBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Personal" : "個人ボード"}
              </button>
            </>
          ) : isSharedMode ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background: "#f3f4f6",
                  color: "#374151",
                }}
              >
                {isEn ? "Shared Preview" : "共有プレビュー"}
              </span>
              <button
                type="button"
                onClick={onSaveSharedToMyBoard}
                className={styles.saveSharedBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Save to Personal" : "個人ボードに保存"}
              </button>
              <button
                type="button"
                onClick={onNavigatePublicBoards}
                className={styles.collabMiniBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Public List" : "公開一覧"}
              </button>
            </>
          ) : (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  background: "#f3f4f6",
                  color: "#111827",
                }}
              >
                {isEn ? "Personal Board" : "個人ボード"}
              </span>
              <button
                type="button"
                onClick={onNavigatePublicBoards}
                className={styles.collabMiniBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isEn ? "Public List" : "公開一覧"}
              </button>
              <button
                type="button"
                disabled={isCreatingRoom}
                onClick={onCreateCollabRoom}
                className={styles.primaryBtn}
                style={{ whiteSpace: "nowrap" }}
              >
                {isCreatingRoom
                  ? isEn
                    ? "Creating..."
                    : "発行中..."
                  : isEn
                  ? "Create Share Link"
                  : "限定共有リンクを発行"}
              </button>
            </>
          )}
        </div>
      </header>

      {isCollabMode && (
        <div
          className={styles.collabBanner}
          style={
            collabBoard?.visibility === "public"
              ? { background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }
              : undefined
          }
        >
          <div className={styles.collabBannerLeft}>
            <span
              className={styles.collabBadge}
              style={
                collabBoard?.visibility === "public"
                  ? { background: "#059669" }
                  : undefined
              }
            >
              {collabBoard?.visibility === "public"
                ? isEn
                  ? "PUBLIC"
                  : "公開"
                : isEn
                ? "UNLISTED"
                : "限定共有"}
            </span>
            <input
              type="text"
              defaultValue={collabBoard?.description || ""}
              key={`${collabBoard?.id || "room"}-${collabBoard?.description || ""}`}
              onBlur={(e) => onSaveCollabDescription(e.target.value)}
              placeholder={
                isEn
                  ? "Theme description (click to edit)"
                  : "テーマの説明（クリックして編集・共有）"
              }
              aria-label="Board theme description"
              className={styles.collabTitleInput}
              style={{ flex: "1 1 280px", maxWidth: 520 }}
            />
            {relatedHub && (
              <Link href="{relatedHub.path}" locale="{locale}" passHref>
                <a
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "#ffffff",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isEn
                    ? `Related: ${relatedHub.labelEn} →`
                    : `関連作品: ${relatedHub.labelJa} →`}
                </a>
              </Link>
            )}
            {roomError && <strong style={{ color: "#dc2626" }}>({roomError})</strong>}
          </div>
          <div className={styles.collabBannerRight}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span>{isEn ? "Your name:" : "あなたの名前:"}</span>
              <input
                type="text"
                maxLength={30}
                value={authorName}
                onChange={(e) => onAuthorNameChange(e.target.value)}
                placeholder={isEn ? "e.g. Student A" : "例: 3年1組 田中"}
                className={styles.authorNameInput}
              />
            </label>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={onRefreshRoom}
              className={styles.collabMiniBtn}
            >
              {isRefreshing
                ? isEn
                  ? "Refreshing..."
                  : "更新中..."
                : refreshSuccess
                ? isEn
                  ? "✓ Updated"
                  : "✓ 更新完了"
                : isEn
                ? "Refresh"
                : "最新に更新"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
