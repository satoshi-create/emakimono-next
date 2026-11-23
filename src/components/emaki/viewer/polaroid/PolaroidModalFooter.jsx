import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/PolaroidModal.module.css";
import { appendBoardItem } from "../board/polaroidBoardStorage";
import { addCollabBoardItem, fetchPublicBoards } from "@/libs/api/ugcApi";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";
import emakisData from "@/data/scroll-metadata";

export function PolaroidModalFooter({
  isOpen,
  isEn,
  src,
  scrollId,
  selectedIndex,
  prevSlot,
  nextSlot,
  pan,
  zoom,
  coverScale,
  cropCx,
  cropCy,
  cropCz,
  currentTheme,
  layoutMode = "polaroid",
  displayTitle,
  displayChapter,
  message,
  onOpenSaveSheet,
  onOpenShareSheet,
  onCloseModal,
}) {
  const router = useRouter();
  const isDevEnv = process.env.NODE_ENV === "development";
  const [footerTab, setFooterTab] = useState("board"); // "board" | "share"
  const [publicBoards, setPublicBoards] = useState([]);
  const [targetPublicBoardId, setTargetPublicBoardId] = useState("");
  const [isPostingPublic, setIsPostingPublic] = useState(false);
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [postAsAdmin, setPostAsAdmin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    if (typeof window !== "undefined") {
      try {
        setAuthorNameInput(
          window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
        );
        const savedAdminKey =
          window.localStorage.getItem("emakimono_board_admin_key") || "";
        const envAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY || "";
        setPostAsAdmin(Boolean(savedAdminKey && savedAdminKey === envAdminKey));
      } catch {
        // noop
      }
    }

    let storedRoom = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem(
          "emakimono_active_collab_room_v1"
        );
        if (raw) storedRoom = JSON.parse(raw);
      } catch {
        storedRoom = null;
      }
    }

    if (storedRoom?.id) {
      setTargetPublicBoardId((prev) => prev || storedRoom.id);
      setPublicBoards((prev) =>
        prev.some((b) => b.id === storedRoom.id) ? prev : [storedRoom, ...prev]
      );
    }

    (async () => {
      try {
        const res = await fetchPublicBoards();
        const list = Array.isArray(res?.boards) ? res.boards : [];
        if (!active || list.length === 0) return;

        const merged =
          storedRoom?.id && !list.some((b) => b.id === storedRoom.id)
            ? [storedRoom, ...list]
            : list;
        setPublicBoards(merged);
        setTargetPublicBoardId((prev) => {
          if (prev && merged.some((b) => b.id === prev)) return prev;
          if (storedRoom?.id && merged.some((b) => b.id === storedRoom.id)) {
            return storedRoom.id;
          }
          if (scrollId) {
            const allHubs = getAllHubPages();
            const matchedBoard = merged.find((b) => {
              const m = String(b.description || "").match(/\n?<!--hubs:([^>]*)-->/);
              if (!m) return false;
              const slugs = m[1].split(",").map((s) => s.trim()).filter(Boolean);
              return allHubs
                .filter((h) => slugs.includes(h.slug) || slugs.includes(h.path))
                .some((hub) =>
                  filterEmakisForHub(emakisData, hub).some(
                    (em) => em?.slug === scrollId || em?.titleen === scrollId
                  )
                );
            });
            if (matchedBoard?.id) return matchedBoard.id;
          }
          return merged[0]?.id || "";
        });
      } catch {
        // 取得失敗時は sessionStorage 由来または空リストを維持
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handlePinToPublicBoard = async () => {
    if (!targetPublicBoardId || isPostingPublic || !src) return;
    const chosen = publicBoards.find((b) => b.id === targetPublicBoardId);
    const authorName = (authorNameInput || "").trim().slice(0, 40);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("emakimono_polaroid_author_v1", authorName);
        if (isDevEnv) {
          const envAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY || "";
          if (postAsAdmin && envAdminKey) {
            window.localStorage.setItem("emakimono_board_admin_key", envAdminKey);
          } else {
            window.localStorage.removeItem("emakimono_board_admin_key");
          }
        }
      } catch {
        // noop
      }
    }
    setIsPostingPublic(true);
    try {
      await addCollabBoardItem(targetPublicBoardId, {
        scrollId,
        sceneIndex: selectedIndex,
        src,
        pan,
        zoom,
        coverScale,
        cx: cropCx,
        cy: cropCy,
        cz: cropCz,
        theme: layoutMode === "senmen" ? `${currentTheme || "white"}:senmen` : currentTheme,
        displayTitle,
        displayChapter,
        message,
        authorName,
      });
      if (typeof window !== "undefined" && chosen) {
        try {
          window.sessionStorage.setItem(
            "emakimono_active_collab_room_v1",
            JSON.stringify({
              id: chosen.id,
              title: chosen.title || "",
            })
          );
        } catch {
          // ignore storage errors
        }
      }
        onCloseModal();
        router.push(
          `/board?room=${encodeURIComponent(targetPublicBoardId)}&pinned=1`,
          undefined,
          { locale: router.locale }
        );
    } catch (error) {
      alert(error.message || "ボードへの投稿に失敗しました");
    } finally {
      setIsPostingPublic(false);
    }
  };

  const handleKeepPersonal = () => {
    appendBoardItem({
      scrollId,
      sceneIndex: selectedIndex,
      src,
      prevSrc: prevSlot?.src || "",
      nextSrc: nextSlot?.src || "",
      pan,
      zoom,
      coverScale,
      cx: cropCx,
      cy: cropCy,
      cz: cropCz,
      theme: layoutMode === "senmen" ? `${currentTheme || "white"}:senmen` : currentTheme,
      displayTitle,
      displayChapter,
      message,
    });
    onCloseModal();
    router.push("/board", undefined, { locale: router.locale });
  };

  const hasPublicBoards = publicBoards.length > 0;

  return (
    <div className={styles.footer}>
      {/* 上部：コンパクトモード切替ピル */}
      <div className={styles.footerTabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={footerTab === "board"}
          className={`${styles.footerTabBtn} ${
            footerTab === "board" ? styles.footerTabBtnActive : ""
          }`}
          onClick={() => setFooterTab("board")}
        >
          {isEn ? "📌 Pin to Board" : "📌 ボードに貼る"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={footerTab === "share"}
          className={`${styles.footerTabBtn} ${
            footerTab === "share" ? styles.footerTabBtnActive : ""
          }`}
          onClick={() => setFooterTab("share")}
        >
          {isEn ? "📤 Save / Share" : "📤 保存・SNS共有"}
        </button>
      </div>

      {/* 下部：選択モードに応じたアクションバー */}
      {footerTab === "board" ? (
        <>
          {hasPublicBoards && (
            <div style={{ marginBottom: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              <input
                type="text"
                maxLength={40}
                value={authorNameInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAuthorNameInput(val);
                  if (typeof window !== "undefined") {
                    try {
                      window.localStorage.setItem("emakimono_polaroid_author_v1", val);
                    } catch {}
                  }
                }}
                placeholder={
                  isEn
                    ? "Your name (optional)"
                    : "投稿者名・ニックネーム（任意）"
                }
                aria-label={isEn ? "Author name" : "投稿者名"}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "6px 10px",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                }}
              />
              {isDevEnv && (
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#b45309",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: 6,
                    padding: "3px 8px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={postAsAdmin}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPostAsAdmin(checked);
                      if (typeof window !== "undefined") {
                        try {
                          const envAdminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY || "";
                          if (checked && envAdminKey) {
                            window.localStorage.setItem("emakimono_board_admin_key", envAdminKey);
                          } else {
                            window.localStorage.removeItem("emakimono_board_admin_key");
                          }
                        } catch {}
                      }
                    }}
                  />
                  <span>
                    {isEn
                      ? "🔑 Post as Admin (DEV only: bypass lock & 1-per-user limit)"
                      : "🔑 管理者として投稿（DEV限定：達成済ロック・1人1枚制限を解除）"}
                  </span>
                </label>
              )}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            {hasPublicBoards && (() => {
              const selectedBoard = publicBoards.find(
                (b) => b.id === targetPublicBoardId
              );
              const odaiMatch = (selectedBoard?.description || "").match(
                /<!--odai:(\{[\s\S]*?\})-->/
              );
              let targetCount = 0;
              if (odaiMatch) {
                try {
                  targetCount = Number(JSON.parse(odaiMatch[1])?.targetCount) || 0;
                } catch {}
              }
              const isGoalReached =
                !postAsAdmin &&
                targetCount > 0 &&
                (selectedBoard?.itemCount || 0) >= targetCount;

              return (
                <div className={styles.footerRow}>
                  <select
                    aria-label={
                      isEn ? "Select public board" : "投稿先の公開ボードを選択"
                    }
                    value={targetPublicBoardId}
                    onChange={(e) => setTargetPublicBoardId(e.target.value)}
                    disabled={isPostingPublic}
                    className={styles.boardSelect}
                    style={{ fontWeight: 700 }}
                  >
                    {publicBoards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {isEn
                          ? `Public: ${board.title || "Shared Board"}`
                          : `公開ボード：${board.title || "公開ボード"}`}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={styles.publicPinBtn}
                    disabled={
                      !src ||
                      !targetPublicBoardId ||
                      isPostingPublic ||
                      isGoalReached
                    }
                    onClick={handlePinToPublicBoard}
                    style={{
                      whiteSpace: "nowrap",
                      paddingInline: 16,
                      ...(isGoalReached
                        ? { backgroundColor: "#64748b", cursor: "not-allowed" }
                        : {}),
                    }}
                  >
                    {isGoalReached
                      ? isEn
                        ? "Completed"
                        : "達成済"
                      : isPostingPublic
                        ? isEn
                          ? "Pinning..."
                          : "投稿中..."
                        : isEn
                          ? "Pin to Public Board"
                          : "公開ボードに貼る"}
                  </button>
                </div>
              );
            })()}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleKeepPersonal}
                style={{
                  background: "none",
                  border: "none",
                  padding: "2px 4px",
                  fontSize: 11,
                  color: "#64748b",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {isEn ? "Save to Personal Board instead" : "自分だけの個人ボードに保存する"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.footerRow}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={onOpenSaveSheet}
            disabled={!src}
          >
            {isEn ? "Save Image / Video" : "画像・動画保存"}
          </button>

          <button
            type="button"
            className={styles.shareBtn}
            onClick={onOpenShareSheet}
            disabled={!src}
            style={{
              backgroundColor: currentTheme === "sumi" ? "#383533" : "#2c3e50",
            }}
          >
            {isEn ? "Share to SNS / Shorts" : "SNS・Shortsに共有"}
          </button>
        </div>
      )}
    </div>
  );
}

export default PolaroidModalFooter;
