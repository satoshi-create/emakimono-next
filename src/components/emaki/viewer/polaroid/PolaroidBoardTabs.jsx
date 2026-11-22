import React, { useState, useEffect } from "react";
import { getBoardPermissions, isClientBoardAdmin } from "./polaroidBoardPolicy";

export function PolaroidBoardTabs({
  isEn,
  isCollabMode,
  tabs = [],
  activeKey,
  onSelectTab,
  onCreateTheme,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isBoardAdmin, setIsBoardAdmin] = useState(false);
  const { canCreateTheme } = getBoardPermissions({ isCollabMode, isBoardAdmin });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const expectedKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
    if (!expectedKey) return;

    const url = new URL(window.location.href);
    const adminParam = url.searchParams.get("admin");
    if (adminParam && adminParam === expectedKey) {
      try {
        window.localStorage.setItem("emakimono_board_admin_key", adminParam);
      } catch {
        // ignore storage errors
      }
      url.searchParams.delete("admin");
      window.history.replaceState({}, "", url.toString());
    }

    setIsBoardAdmin(isClientBoardAdmin());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = draftTitle.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onCreateTheme(trimmed);
      setDraftTitle("");
      setIsCreating(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        role="tablist"
        aria-label={isEn ? "Theme tabs" : "テーマタブ"}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          padding: "6px 12px 0",
          background: "#e2e8f0",
          borderBottom: "1px solid #cbd5e1",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                background: isActive ? "#ffffff" : "#f1f5f9",
                color: isActive ? "#0f172a" : "#64748b",
                border: "1px solid #cbd5e1",
                borderBottom: isActive ? "1px solid #ffffff" : "1px solid #cbd5e1",
                marginBottom: -1,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                maxWidth: 220,
                flexShrink: 0,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 11 }}>
                {tab.type === "public" ? "🌐" : "🔒"}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.title || (isEn ? "Untitled Theme" : "無題のテーマ")}
              </span>
            </button>
          );
        })}

        {canCreateTheme && (
        <button
          type="button"
          title={
            isCollabMode
              ? isEn
                ? "New public theme"
                : "新しい公開テーマを作成"
              : isEn
              ? "New personal theme"
              : "新しい個人テーマを作成"
          }
          onClick={() => setIsCreating((prev) => !prev)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: 6,
            border: isCreating ? "1px solid #94a3b8" : "none",
            background: isCreating ? "#ffffff" : "transparent",
            color: "#334155",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 3,
            flexShrink: 0,
          }}
        >
          ＋
        </button>
        )}
      </div>

      {isCreating && canCreateTheme && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "8px 14px",
            background: "#ffffff",
            borderBottom: "1px solid #cbd5e1",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
            {isCollabMode
              ? isEn
                ? "🌐 New Public Theme:"
                : "🌐 新規公開テーマ:"
              : isEn
              ? "🔒 New Personal Theme:"
              : "🔒 新規個人テーマ:"}
          </span>
          <input
            type="text"
            autoFocus
            maxLength={80}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder={
              isEn
                ? "Enter theme name..."
                : "テーマ名を入力（例: 鳥獣戯画のお気に入り動物）"
            }
            style={{
              flex: "1 1 220px",
              maxWidth: 340,
              fontSize: 12.5,
              padding: "5px 9px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
            }}
          />
          <button
            type="submit"
            disabled={!draftTitle.trim() || submitting}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "..." : isEn ? "Create" : "作成"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setDraftTitle("");
            }}
            style={{
              padding: "5px 8px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {isEn ? "Cancel" : "キャンセル"}
          </button>
        </form>
      )}
    </div>
  );
}
