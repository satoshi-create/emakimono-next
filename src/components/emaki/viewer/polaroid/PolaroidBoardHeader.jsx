import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./PolaroidBoardView.module.css";

export function PolaroidBoardHeader({
  isEn,
  locale,
  isCollabMode,
  onSwitchToPersonal,
  onSwitchToPublic,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header
      className={styles.header}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 16px",
        minHeight: 48,
      }}
    >
      {/* 左：個人・公開切り替えピルのみ */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div
          role="group"
          aria-label={isEn ? "Board mode switch" : "ボードモード切替"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#f1f5f9",
            padding: 3,
            borderRadius: 999,
            border: "1px solid #cbd5e1",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isCollabMode && onSwitchToPersonal) onSwitchToPersonal();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 999,
              border: "none",
              fontSize: 12,
              fontWeight: !isCollabMode ? 700 : 500,
              background: !isCollabMode ? "#ffffff" : "transparent",
              color: !isCollabMode ? "#0f172a" : "#64748b",
              boxShadow: !isCollabMode ? "0 1px 3px rgba(15, 23, 42, 0.12)" : "none",
              cursor: !isCollabMode ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true">🔒</span>
            <span>{isEn ? "Personal" : "個人ボード"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isCollabMode && onSwitchToPublic) onSwitchToPublic();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 999,
              border: "none",
              fontSize: 12,
              fontWeight: isCollabMode ? 700 : 500,
              background: isCollabMode ? "#dcfce7" : "transparent",
              color: isCollabMode ? "#166534" : "#64748b",
              boxShadow: isCollabMode ? "0 1px 3px rgba(22, 101, 52, 0.14)" : "none",
              cursor: isCollabMode ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden="true">🌐</span>
            <span>{isEn ? "Public" : "公開ボード"}</span>
          </button>
        </div>
      </div>

      {/* 右上：ハンバーガーメニュー */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-label={isEn ? "Menu" : "メニュー"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#1e293b",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ☰
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              minWidth: 200,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
              padding: 6,
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Link href="/board/personal" locale={locale} passHref>
              <a
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#1e293b",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🔒</span>
                <span>{isEn ? "Personal Boards List" : "個人ボード一覧"}</span>
              </a>
            </Link>
            <Link href="/board/public" locale={locale} passHref>
              <a
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#1e293b",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🌐</span>
                <span>{isEn ? "Public Boards List" : "公開ボード一覧"}</span>
              </a>
            </Link>
            <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
            <Link href="/" locale={locale} passHref>
              <a
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#475569",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>🖼️</span>
                <span>{isEn ? "Emaki Gallery (Home)" : "絵巻一覧（トップ）"}</span>
              </a>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
