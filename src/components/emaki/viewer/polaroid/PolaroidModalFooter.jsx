import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/PolaroidModal.module.css";
import { appendBoardItem } from "./polaroidBoardStorage";
import { addCollabBoardItem, fetchPublicBoards } from "@/libs/api/ugcApi";

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
  displayTitle,
  displayChapter,
  message,
  onOpenSaveSheet,
  onOpenShareSheet,
  onCloseModal,
}) {
  const router = useRouter();
  const [footerTab, setFooterTab] = useState("board"); // "board" | "share"
  const [publicBoards, setPublicBoards] = useState([]);
  const [targetPublicBoardId, setTargetPublicBoardId] = useState("");
  const [isPostingPublic, setIsPostingPublic] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

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
    const authorName =
      typeof window !== "undefined"
        ? window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
        : "";
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
        theme: currentTheme,
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
        `/board?room=${encodeURIComponent(targetPublicBoardId)}`,
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
      theme: currentTheme,
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

      {/* 下部：選択モードに応じた1行アクションバー */}
      {footerTab === "board" ? (
        <div className={styles.footerRow}>
          {hasPublicBoards && (
            <>
              <select
                aria-label={isEn ? "Select public board" : "投稿先の公開ボードを選択"}
                value={targetPublicBoardId}
                onChange={(e) => setTargetPublicBoardId(e.target.value)}
                disabled={isPostingPublic}
                className={styles.boardSelect}
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
              >
                {isPostingPublic
                  ? isEn
                    ? "..."
                    : "投稿中"
                  : isEn
                    ? "Pin"
                    : "貼る"}
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.personalCompactBtn}
            style={hasPublicBoards ? undefined : { flex: 1 }}
            onClick={handleKeepPersonal}
            title={isEn ? "Keep on Personal Board" : "個人ボードにキープ"}
          >
            {isEn ? "Personal" : "個人ボード"}
          </button>
        </div>
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
