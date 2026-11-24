import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/PolaroidModal.module.css";
import { appendBoardItem } from "../board/polaroidBoardStorage";
import { addCollabBoardItem, fetchPublicBoards } from "@/libs/api/ugcApi";
import { trackBoardItemPin } from "@/libs/api/measurementUtils";
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
  const [boardTargetMode, setBoardTargetMode] = useState("public"); // "public" | "personal"
  const [publicBoards, setPublicBoards] = useState([]);
  const [targetPublicBoardId, setTargetPublicBoardId] = useState("");
  const [isPostingPublic, setIsPostingPublic] = useState(false);
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [postAsAdmin, setPostAsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncAuthor = () => {
      try {
        setAuthorNameInput(
          window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
        );
      } catch {}
    };
    window.addEventListener("emakimono-author-change", syncAuthor);
    return () => window.removeEventListener("emakimono-author-change", syncAuthor);
  }, []);

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
        trackBoardItemPin({
          boardType: "public",
          boardId: targetPublicBoardId,
          scrollId: scrollId || "",
          hasMessage: Boolean(message),
        });
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
    trackBoardItemPin({
      boardType: "personal",
      boardId: "default",
      scrollId: scrollId || "",
      hasMessage: Boolean(message),
    });
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

  const effectiveMode = hasPublicBoards ? boardTargetMode : "personal";

  return (
    <div className={styles.footer} style={{ gap: 6, paddingTop: 6 }}>
      {/* 1行目：🌐公開 / 🔒個人 切替ピル ＋ 選択に応じた投稿・保存ボタン */}
      <div className={styles.footerRow} style={{ gap: 6, alignItems: "center" }}>
        {hasPublicBoards && (
          <div
            role="group"
            aria-label={isEn ? "Target board type" : "保存先ボード切替"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#f1f5f9",
              padding: 2,
              borderRadius: 999,
              border: "1px solid #cbd5e1",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setBoardTargetMode("public")}
              style={{
                padding: "4px 9px",
                borderRadius: 999,
                border: "none",
                fontSize: 11,
                fontWeight: effectiveMode === "public" ? 700 : 500,
                background: effectiveMode === "public" ? "#dcfce7" : "transparent",
                color: effectiveMode === "public" ? "#166534" : "#64748b",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isEn ? "🌐 Public" : "🌐 公開"}
            </button>
            <button
              type="button"
              onClick={() => setBoardTargetMode("personal")}
              style={{
                padding: "4px 9px",
                borderRadius: 999,
                border: "none",
                fontSize: 11,
                fontWeight: effectiveMode === "personal" ? 700 : 500,
                background: effectiveMode === "personal" ? "#ffffff" : "transparent",
                color: effectiveMode === "personal" ? "#0f172a" : "#64748b",
                boxShadow:
                  effectiveMode === "personal"
                    ? "0 1px 2px rgba(15, 23, 42, 0.12)"
                    : "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isEn ? "🔒 Personal" : "🔒 個人"}
            </button>
          </div>
        )}

        {effectiveMode === "public" ? (
          <>
            <select
              aria-label={isEn ? "Select public board" : "投稿先の公開ボードを選択"}
              value={targetPublicBoardId}
              onChange={(e) => setTargetPublicBoardId(e.target.value)}
              disabled={isPostingPublic}
              className={styles.boardSelect}
              style={{
                flex: 1,
                minWidth: 0,
                fontWeight: 700,
                height: 34,
                fontSize: 12,
              }}
            >
              {publicBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title || (isEn ? "Shared Board" : "公開ボード")}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.publicPinBtn}
              disabled={!src || !targetPublicBoardId || isPostingPublic}
              onClick={handlePinToPublicBoard}
              style={{
                whiteSpace: "nowrap",
                paddingInline: 12,
                height: 34,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {isPostingPublic
                ? isEn
                  ? "Pinning..."
                  : "投稿中..."
                : isEn
                  ? "📌 Pin"
                  : "📌 貼る"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.publicPinBtn}
            disabled={!src}
            onClick={handleKeepPersonal}
            style={{
              flex: 1,
              height: 34,
              fontSize: 12,
              backgroundColor: "#0f172a",
              color: "#ffffff",
              borderColor: "#0f172a",
            }}
          >
            {isEn ? "🔒 Save to Personal Board" : "🔒 個人ボードに保存する"}
          </button>
        )}
      </div>

      {/* 2行目：画像保存 ＋ SNS共有 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
        }}
      >
        <button
          type="button"
          className={styles.saveBtn}
          onClick={onOpenSaveSheet}
          disabled={!src}
          style={{ flex: 1, height: 32, fontSize: 12, padding: "0 10px" }}
        >
          {isEn ? "Save Image / Video" : "画像・動画保存"}
        </button>
        <button
          type="button"
          className={styles.shareBtn}
          onClick={onOpenShareSheet}
          disabled={!src}
          style={{ flex: 1, height: 32, fontSize: 12, padding: "0 10px" }}
        >
          {isEn ? "Share to SNS" : "SNS共有"}
        </button>
      </div>
    </div>
  );
}

export default PolaroidModalFooter;
