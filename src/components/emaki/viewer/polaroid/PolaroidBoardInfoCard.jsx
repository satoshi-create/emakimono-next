import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getAllHubPages } from "@/libs/hubPages";
import {
  getBoardPermissions,
  isClientBoardAdmin,
  parseOdaiMeta,
} from "./polaroidBoardPolicy";

export function PolaroidBoardInfoCard({
  isEn,
  locale,
  isCollabMode,
  isSharedMode,
  collabBoard,
  items,
  collabTitleDraft,
  setCollabTitleDraft,
  collabDescription,
  onSaveCollabTitle,
  onSaveCollabDescription,
  personalMeta,
  setPersonalMeta,
  onSavePersonalTitle,
  onSavePersonalDescription,
  relatedHubSlugs = [],
  onChangeRelatedHubSlugs,
  onSaveSharedToMyBoard,
  roomError,
  authorName,
  onAuthorNameChange,
  isRefreshing,
  refreshSuccess,
  onRefreshRoom,
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const allHubs = getAllHubPages();
  const selectedHubs = allHubs.filter((h) => relatedHubSlugs.includes(h.slug));
  const unselectedHubs = allHubs.filter((h) => !relatedHubSlugs.includes(h.slug));

  const displayTitle = isCollabMode
    ? collabTitleDraft || collabBoard?.title || ""
    : personalMeta?.title || "";

  const isBoardAdmin = isClientBoardAdmin();
  const { canEditBoardMeta } = getBoardPermissions({
    isCollabMode,
    isSharedMode,
    isBoardAdmin,
    isBoardOwner: Boolean(collabBoard?.isOwner),
  });

  const odaiMeta = useMemo(() => {
    if (!isCollabMode || !collabBoard?.description) return null;
    const parsed = parseOdaiMeta(collabBoard.description);
    return parsed.prompt ? parsed : null;
  }, [isCollabMode, collabBoard?.description]);

  const currentItemCount = items?.length ?? collabBoard?.items?.length ?? 0;

  useEffect(() => {
    if (!expanded) return;
    const handleMouseDown = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [expanded]);

  const pillBtnStyle = {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    borderRadius: 8,
    height: 28,
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  };

  if (!expanded) {
    const hasOdaiBanner = Boolean(isCollabMode && odaiMeta?.prompt);
    return (
      <aside
        ref={cardRef}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 25,
          height: hasOdaiBanner ? "auto" : 38,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(15, 23, 42, 0.14)",
          borderRadius: hasOdaiBanner ? 16 : 999,
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.1)",
          padding: hasOdaiBanner ? "10px 14px 12px" : "0 8px 0 12px",
          display: hasOdaiBanner ? "flex" : "inline-flex",
          flexDirection: hasOdaiBanner ? "column" : "row",
          alignItems: hasOdaiBanner ? "stretch" : "center",
          gap: hasOdaiBanner ? 8 : 8,
          width: hasOdaiBanner ? "min(640px, calc(100vw - 28px))" : "auto",
          maxWidth: "calc(100vw - 28px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title={displayTitle || (isEn ? "Board" : "ボード")}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            maxWidth: 220,
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>
            {isCollabMode ? "🌐" : "🔒"}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayTitle || (isEn ? "Untitled" : "無題")}
          </span>
        </button>

        {selectedHubs.length > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {isEn
              ? `${selectedHubs.length} hub${selectedHubs.length > 1 ? "s" : ""}`
              : `関連ハブ ${selectedHubs.length}件`}
          </span>
        )}

        {canEditBoardMeta && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={pillBtnStyle}
          >
            {isEn ? "⚙️ Edit" : "⚙️ 編集"}
          </button>
        )}

        {isCollabMode && (
          <button
            type="button"
            disabled={isRefreshing}
            onClick={onRefreshRoom}
            title={isEn ? "Refresh" : "最新に更新"}
            style={{
              ...pillBtnStyle,
              width: 28,
              padding: 0,
              borderColor: "#f59e0b",
              background: "#fffbeb",
              color: "#b45309",
            }}
          >
            {isRefreshing ? "…" : refreshSuccess ? "✓" : "↻"}
          </button>
        )}
        </div>

        {isCollabMode && odaiMeta?.prompt && (() => {
            const mode = odaiMeta.mode || "coop";
            const safeItems = Array.isArray(items) ? items : [];
            const isUtaawase = mode === "utaawase";
            const isUnique = mode === "unique";
            const theme = isUtaawase
              ? {
                  bg: "#f5f3ff",
                  border: "#c4b5fd",
                  text: "#4c1d95",
                  badgeBg: "#ede9fe",
                  badgeText: "#5b21b6",
                  badgeLabel: isEn ? "⚔️ Uta-awase Duel" : "⚔️ 歌合・左右対決モード",
                }
              : isUnique
              ? {
                  bg: "#ecfdf5",
                  border: "#6ee7b7",
                  text: "#064e3b",
                  badgeBg: "#d1fae5",
                  badgeText: "#065f46",
                  badgeLabel: isEn ? "🔍 No-Duplicates" : "🔍 かぶり禁止モード",
                }
              : {
                  bg: "#fffbeb",
                  border: "#fcd34d",
                  text: "#92400e",
                  badgeBg: "#fef3c7",
                  badgeText: "#b45309",
                  badgeLabel: isEn ? "🤝 Co-op Collection" : "🤝 協力コレクション",
                };

            const leftItems = safeItems.filter((_, idx) => idx % 2 === 0);
            const rightItems = safeItems.filter((_, idx) => idx % 2 === 1);
            const leftLikes = leftItems.reduce((sum, it) => sum + (it.likeCount || 0), 0);
            const rightLikes = rightItems.reduce((sum, it) => sum + (it.likeCount || 0), 0);
            const postedScenes = Array.from(
              new Set(
                safeItems
                  .map((it) => it.displayChapter || it.displayTitle)
                  .filter(Boolean)
              )
            );
            const progressPct =
              odaiMeta.targetCount > 0
                ? Math.min(100, Math.round((currentItemCount / odaiMeta.targetCount) * 100))
                : 0;

            return (
              <div
                style={{
                  width: "100%",
                  marginTop: 2,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  fontSize: 13.5,
                  color: theme.text,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: theme.badgeBg,
                        color: theme.badgeText,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {theme.badgeLabel}
                    </span>
                    {odaiMeta.onePerUser && (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "1px solid #fca5a5",
                        }}
                      >
                        🔒 {isEn ? "1 per user" : "1人1枚限定"}
                      </span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.45 }}>
                      📜 {isEn ? "Theme:" : "お題:"} {odaiMeta.prompt}
                    </span>
                  </div>
                  {odaiMeta.targetCount > 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background:
                          currentItemCount >= odaiMeta.targetCount
                            ? "#dcfce7"
                            : "#ffffff",
                        color:
                          currentItemCount >= odaiMeta.targetCount
                            ? "#166534"
                            : theme.badgeText,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {currentItemCount >= odaiMeta.targetCount
                        ? isEn
                          ? `🔒 Goal Reached — Submissions Locked (${currentItemCount}/${odaiMeta.targetCount})`
                          : `🔒 目標達成！投稿締切ロック中 (${currentItemCount} / ${odaiMeta.targetCount}枚)`
                        : isEn
                        ? `Posts: ${currentItemCount}/${odaiMeta.targetCount} (${
                            odaiMeta.targetCount - currentItemCount
                          } left)`
                        : `投稿数: ${currentItemCount} / ${odaiMeta.targetCount}枚（あと${
                            odaiMeta.targetCount - currentItemCount
                          }枚で達成！）`}
                    </span>
                  )}
                </div>

                {/* モード別の視覚インジケータ */}
                {isUtaawase ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "7px 12px",
                      borderRadius: 6,
                      background: "#ffffff",
                      border: "1px solid #ddd6fe",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: "#be123c" }}>
                      🌸 左方（紅組）: {leftItems.length}首 / 👏 {leftLikes}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 10 }}>VS</span>
                    <span style={{ color: "#1d4ed8" }}>
                      🍁 右方（白組）: {rightItems.length}首 / 👏 {rightLikes}
                    </span>
                  </div>
                ) : isUnique ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexWrap: "wrap",
                      padding: "7px 12px",
                      borderRadius: 6,
                      background: "#ffffff",
                      border: "1px solid #a7f3d0",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#065f46" }}>
                      🚫 {isEn ? "Already Posted:" : "投稿済みの場面（かぶり注意）:"}
                    </span>
                    {postedScenes.length === 0 ? (
                      <span style={{ color: "#6b7280" }}>
                        {isEn ? "None yet — be the first!" : "まだありません（一番乗りチャンス！）"}
                      </span>
                    ) : (
                      postedScenes.map((scene) => (
                        <span
                          key={scene}
                          style={{
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                            fontSize: 10.5,
                          }}
                        >
                          {scene}
                        </span>
                      ))
                    )}
                  </div>
                ) : odaiMeta.targetCount > 0 ? (
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      borderRadius: 999,
                      background: "rgba(255, 255, 255, 0.85)",
                      border: "1px solid #fcd34d",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: "100%",
                        background:
                          currentItemCount >= odaiMeta.targetCount
                            ? "#16a34a"
                            : "#f59e0b",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                ) : null}

                <div
                  style={{
                    fontSize: 13,
                    color: theme.text,
                    background: "rgba(255, 255, 255, 0.72)",
                    padding: "7px 10px",
                    borderRadius: 6,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>{isEn ? "Rule: " : "【遊び方・ルール】"}</strong>
                  {isUtaawase
                    ? isEn
                      ? "Post matching scenes (alternating Left vs Right team), write a verse, and vote with 'Like!'."
                      : "① 投稿順に「🌸左方」と「🍁右方」に分かれて対決！ → ② 一言コメント（一句）を添えて投稿 → ③ 好きな方に「👏 いいね！」で投票！"
                    : isUnique
                    ? isEn
                      ? "Avoid already-posted scenes listed above and discover unique moments!"
                      : "① 上の「投稿済みの場面」と被らないシーンを絵巻から切り抜いて投稿 → ② みんなで新しい名場面を発掘しよう！"
                    : isEn
                    ? "Pin matching scenes together to fill the progress bar!"
                    : "① 絵巻ビューアのポラロイド機能で場面を切り抜き、このボードへ投稿 → ② みんなでゲージを100%にして目標達成しよう！"}
                </div>
              </div>
            );
          })()}
      </aside>
    );
  }

  return (
    <aside
      ref={cardRef}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 14,
        left: 14,
        zIndex: 25,
        width: "min(340px, calc(100vw - 32px))",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(15, 23, 42, 0.12)",
        borderRadius: 12,
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              background: isCollabMode ? "#dcfce7" : "#f1f5f9",
              color: isCollabMode ? "#166534" : "#334155",
              flexShrink: 0,
            }}
          >
            <span>{isCollabMode ? "🌐" : "🔒"}</span>
            <span>
              {isCollabMode
                ? isEn
                  ? "Public Board"
                  : "公開ボード"
                : isEn
                ? "Personal Board"
                : "個人ボード"}
            </span>
          </span>
        </div>

        <button
          type="button"
          title={isEn ? "Close panel" : "閉じる"}
          onClick={() => setExpanded(false)}
          style={{
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#475569",
            borderRadius: 6,
            height: 26,
            padding: "0 8px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          {isEn ? "✕ Close" : "✕ 閉じる"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {isCollabMode ? (
          <input
            type="text"
            value={collabTitleDraft}
            onChange={(e) => setCollabTitleDraft(e.target.value)}
            onBlur={onSaveCollabTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={isEn ? "Board theme title..." : "テーマ名を入力..."}
            style={{
              width: "100%",
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              padding: "6px 9px",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <input
            type="text"
            value={personalMeta?.title || ""}
            onChange={(e) =>
              setPersonalMeta((prev) => ({ ...prev, title: e.target.value }))
            }
            onBlur={(e) => onSavePersonalTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={isEn ? "Personal board title..." : "ボード名を入力..."}
            style={{
              width: "100%",
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              padding: "6px 9px",
              fontFamily: "inherit",
            }}
          />
        )}

        {isCollabMode ? (
          <textarea
            rows={2}
            defaultValue={collabDescription || ""}
            key={`${collabBoard?.id || "room"}-${collabDescription || ""}`}
            onBlur={(e) => onSaveCollabDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={
              isEn
                ? "Theme description (click to edit)"
                : "テーマの解説を入力（Enterで保存）"
            }
            style={{
              width: "100%",
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#475569",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              padding: "5px 9px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <textarea
            rows={2}
            value={personalMeta?.description || ""}
            onChange={(e) =>
              setPersonalMeta((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            onBlur={(e) => onSavePersonalDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={
              isEn
                ? "Notes or description..."
                : "ボードのメモ・解説を入力..."
            }
            style={{
              width: "100%",
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#475569",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              padding: "5px 9px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        )}

        {roomError && (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>
            {roomError}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
            {isEn ? "Related Theme Hubs" : "関連特集ハブ"}
          </span>
          {unselectedHubs.length > 0 && onChangeRelatedHubSlugs && (
            <select
              value=""
              onChange={(e) => {
                const slug = e.target.value;
                if (slug && !relatedHubSlugs.includes(slug)) {
                  onChangeRelatedHubSlugs([...relatedHubSlugs, slug]);
                }
              }}
              style={{
                fontSize: 11.5,
                padding: "3px 6px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                maxWidth: 185,
              }}
            >
              <option value="">
                {isEn ? "+ Add hub..." : "+ 関連ハブを追加 ▾"}
              </option>
              {unselectedHubs.map((h) => (
                <option key={h.slug} value={h.slug}>
                  {isEn ? h.titleEn || h.titleJa : h.titleJa}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedHubs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {selectedHubs.map((hub) => (
              <span
                key={hub.slug}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                }}
              >
                <Link href={hub.path} locale={locale} passHref>
                  <a style={{ color: "inherit", textDecoration: "none" }}>
                    {isEn ? hub.titleEn || hub.titleJa : hub.titleJa}
                  </a>
                </Link>
                {onChangeRelatedHubSlugs && (
                  <button
                    type="button"
                    aria-label="Remove hub"
                    onClick={() =>
                      onChangeRelatedHubSlugs(
                        relatedHubSlugs.filter((s) => s !== hub.slug)
                      )
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#059669",
                      fontSize: 11,
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {isCollabMode ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingTop: 6,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: "#475569",
              flex: 1,
              minWidth: 0,
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>
              {isEn ? "Name:" : "投稿者:"}
            </span>
            <input
              type="text"
              maxLength={30}
              value={authorName}
              onChange={(e) => onAuthorNameChange(e.target.value)}
              placeholder={isEn ? "Viewer A" : "ユーザーA"}
              style={{
                width: "100%",
                fontSize: 12,
                padding: "4px 7px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
              }}
            />
          </label>

          <button
            type="button"
            disabled={isRefreshing}
            onClick={onRefreshRoom}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 6,
              border: "1px solid #f59e0b",
              background: "#fffbeb",
              color: "#b45309",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isRefreshing
              ? "..."
              : refreshSuccess
              ? isEn
                ? "✓ Updated"
                : "✓ 更新済"
              : isEn
              ? "Refresh"
              : "最新に更新"}
          </button>
        </div>
      ) : isSharedMode ? (
        <button
          type="button"
          onClick={onSaveSharedToMyBoard}
          style={{
            width: "100%",
            padding: "6px 10px",
            borderRadius: 7,
            border: "none",
            background: "#0f172a",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {isEn ? "Save to Personal Board" : "個人ボードに保存する"}
        </button>
      ) : null}
    </aside>
  );
}
