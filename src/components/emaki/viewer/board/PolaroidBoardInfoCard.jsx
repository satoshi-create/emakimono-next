import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import emakisData from "@/data/scroll-metadata";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";
import {
  getBoardPermissions,
  isClientBoardAdmin,
  parseOdaiMeta,
} from "./polaroidBoardPolicy";
import { usePolaroidBoardMeta } from "./usePolaroidBoardMeta";

export function PolaroidBoardInfoCard({
  isEn,
  locale,
  isCollabMode,
  isSharedMode,
  collabBoard,
  setCollabBoard,
  roomParam,
  personalParam,
  items,
  collabTitleDraft: collabTitleDraftProp,
  setCollabTitleDraft: setCollabTitleDraftProp,
  collabDescription: collabDescriptionProp,
  onSaveCollabTitle: onSaveCollabTitleProp,
  onSaveCollabDescription: onSaveCollabDescriptionProp,
  personalMeta: personalMetaProp,
  setPersonalMeta: setPersonalMetaProp,
  onSavePersonalTitle: onSavePersonalTitleProp,
  onSavePersonalDescription: onSavePersonalDescriptionProp,
  relatedHubSlugs: relatedHubSlugsProp,
  onChangeRelatedHubSlugs: onChangeRelatedHubSlugsProp,
  onSaveSharedToMyBoard,
  roomError,
  setRoomError,
  authorName,
  onAuthorNameChange,
  isRefreshing,
  refreshSuccess,
  onRefreshRoom,
}) {
  const router = useRouter();
  const internalMeta = usePolaroidBoardMeta({
    router,
    isCollabMode,
    roomParam,
    personalParam,
    collabBoard,
    setCollabBoard,
    setRoomError,
  });

  const collabTitleDraft = collabTitleDraftProp ?? internalMeta.collabTitleDraft;
  const setCollabTitleDraft = setCollabTitleDraftProp ?? internalMeta.setCollabTitleDraft;
  const collabDescription =
    collabDescriptionProp ?? internalMeta.parsedCollab.cleanDescription;
  const onSaveCollabTitle = onSaveCollabTitleProp ?? internalMeta.handleSaveCollabTitle;
  const onSaveCollabDescription =
    onSaveCollabDescriptionProp ?? internalMeta.handleSaveCollabDescription;
  const personalMeta = personalMetaProp ?? internalMeta.personalMeta;
  const setPersonalMeta = setPersonalMetaProp ?? internalMeta.setPersonalMeta;
  const onSavePersonalTitle =
    onSavePersonalTitleProp ?? internalMeta.handleSavePersonalTitle;
  const onSavePersonalDescription =
    onSavePersonalDescriptionProp ?? internalMeta.handleSavePersonalDescription;
  const relatedHubSlugs =
    relatedHubSlugsProp ??
    (isCollabMode
      ? internalMeta.parsedCollab.relatedHubs
      : internalMeta.personalMeta?.relatedHubs || []);
  const onChangeRelatedHubSlugs =
    onChangeRelatedHubSlugsProp ??
    (isCollabMode
      ? internalMeta.handleSaveCollabRelatedHubs
      : internalMeta.handleSavePersonalRelatedHubs);

  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const allHubs = getAllHubPages();
  const selectedHubs = allHubs.filter((h) => relatedHubSlugs.includes(h.slug));
  const unselectedHubs = allHubs.filter((h) => !relatedHubSlugs.includes(h.slug));

  const relatedEmakis = useMemo(() => {
    if (!selectedHubs.length) return [];
    const seen = new Set();
    const list = [];
    for (const hub of selectedHubs) {
      for (const emaki of filterEmakisForHub(emakisData, hub)) {
        const slug = emaki?.slug || emaki?.titleen;
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        list.push({
          slug,
          titleJa: `${emaki.title ?? ""}${emaki.edition ? ` ${emaki.edition}` : ""}`.trim(),
          titleEn: `${emaki.titleen ?? slug}`.trim(),
        });
      }
    }
    return list;
  }, [selectedHubs]);

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
    const targetDone =
      odaiMeta?.targetCount > 0 && currentItemCount >= odaiMeta.targetCount;
    const countLabel =
      odaiMeta?.targetCount > 0
        ? targetDone
          ? isEn
            ? "✓ Done"
            : "✓ 完了"
          : isEn
          ? `${currentItemCount}/${odaiMeta.targetCount}`
          : `${currentItemCount}/${odaiMeta.targetCount}枚`
        : isEn
        ? `${currentItemCount} item${currentItemCount === 1 ? "" : "s"}`
        : `${currentItemCount}件`;

    const odaiModeLabel = odaiMeta
      ? (() => {
          const m = odaiMeta.mode;
          const base =
            m === "coop"
              ? isEn
                ? "Co-op"
                : "協力"
              : m === "utaawase"
              ? isEn
                ? "Uta-awase"
                : "歌合わせ"
              : m === "unique"
              ? isEn
                ? "Unique"
                : "唯一"
              : m || "";
          if (!base) return "";
          return odaiMeta.onePerUser
            ? `${base}${isEn ? " · 1/user" : " · 1人1枚"}`
            : base;
        })()
      : "";

    const ellipsisText = {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      minWidth: 0,
    };

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
          height: 32,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(15, 23, 42, 0.14)",
          borderRadius: 999,
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.1)",
          padding: "0 10px 0 12px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 28px)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title={
            odaiMeta?.prompt || displayTitle || (isEn ? "Board" : "ボード")
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: odaiMeta ? "1 1 auto" : undefined,
            fontFamily: "inherit",
            overflow: "hidden",
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>
            {isCollabMode ? "🌐" : "🔒"}
          </span>
          {odaiMeta ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
                ...ellipsisText,
              }}
            >
              {odaiMeta.prompt}
            </span>
          ) : null}
        </button>

        {odaiMeta && odaiModeLabel ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#eef2ff",
              color: "#4338ca",
              border: "1px solid #c7d2fe",
              flexShrink: 0,
              maxWidth: "34%",
              ...ellipsisText,
            }}
          >
            {odaiModeLabel}
          </span>
        ) : null}

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: targetDone ? "#047857" : "#64748b",
            flexShrink: 0,
          }}
        >
          {countLabel}
        </span>

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
            }}
          >
            {isEn
              ? `${selectedHubs.length} hub${selectedHubs.length > 1 ? "s" : ""}`
              : `ハブ${selectedHubs.length}`}
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

        {isSharedMode && (
          <button
            type="button"
            onClick={onSaveSharedToMyBoard}
            title={isEn ? "Save to Personal Board" : "個人ボードに保存する"}
            style={pillBtnStyle}
          >
            {isEn ? "💾 Save" : "💾 保存"}
          </button>
        )}
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

        {relatedEmakis.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            {relatedEmakis.map((emaki) => (
              <Link
                href={`/${emaki.slug}`}
                key={emaki.slug}
                locale={locale}
                passHref
              >
                <a
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    textDecoration: "none",
                  }}
                >
                  📜 {isEn ? emaki.titleEn : emaki.titleJa}
                </a>
              </Link>
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
