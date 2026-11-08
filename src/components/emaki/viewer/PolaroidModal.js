import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import styles from "@/styles/PolaroidModal.module.css";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import {
  ChaptersTitle,
  connectEmakiTextData,
  isGenjiWork,
  resolveGenjiMasterChapter,
  connectGenjiChapters,
} from "@/utils/emakiChapterText";
import {
  THEMES,
  FORMATS,
  PHOTO_DW,
  PHOTO_DH,
  MESSAGE_MAX,
  getThemeTextureUrl,
} from "./polaroid/polaroidCanvasRenderer";
import { usePolaroidPanZoom } from "./polaroid/usePolaroidPanZoom";
import { usePolaroidExport } from "./polaroid/usePolaroidExport";

export function PolaroidModal({
  isOpen,
  onClose,
  scenes = [],
  initialIndex = 0,
  initialZoom,
  initialPan,
  emakiTitle,
  titleen,
  titleEn,
  scrollTitleEn,
  title,
}) {
  const [currentTheme, setCurrentTheme] = useState("white");
  const [message, setMessage] = useState("");
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const router = useRouter();
  const locale = router.locale ?? "ja";
  const isEn = locale === "en";

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobileDevice(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""));
    }
  }, []);

  const canShareFiles =
    typeof navigator !== "undefined" &&
    isMobileDevice &&
    typeof navigator.share === "function";

  const scrollId =
    typeof titleen === "string" && titleen
      ? titleen
      : typeof router.query?.slug === "string"
        ? router.query.slug
        : "";
  const scrollTitle =
    (typeof title === "string" ? title : "") || emakiTitle || "";

  // 1. Pan/Zoom & 画像ロードフック
  const {
    selectedIndex,
    zoom,
    setZoom,
    pan,
    coverScale,
    panoramaSlots,
    frameW,
    dragging,
    frameRef,
    loadedImagesRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePolaroidPanZoom({
    isOpen,
    scenes,
    initialIndex,
    initialZoom,
    initialPan,
  });

  const currentScene = scenes[selectedIndex] || scenes[0];
  const currentLinkId = currentScene?.linkId ?? 0;
  const rawSrc = currentScene?.src ?? "";
  const src = rawSrc ? buildCloudinaryUrl(rawSrc) : "";

  const safeString = (val) =>
    typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : "";

  // 詞書・章タイトル解決
  const { resolvedChapterTitle } = useMemo(() => {
    let ekotoba = null;
    for (let i = 0; i < scenes.length; i++) {
      const item = scenes[i];
      if (item?.cat === "ekotoba" && item.linkId <= currentLinkId) ekotoba = item;
    }
    if (!ekotoba) return { resolvedChapterTitle: "" };

    let chapterTitleStr = "";

    const fromJson = connectEmakiTextData(scrollId, ekotoba.chapter, isEn ? "titleen" : "title");
    if (typeof fromJson === "string" && fromJson.trim()) {
      chapterTitleStr = fromJson.trim();
    }

    if (!chapterTitleStr && isGenjiWork(scrollId, scrollTitle)) {
      const masterCh = resolveGenjiMasterChapter(
        scrollId,
        ekotoba.chapter,
        ekotoba.genji_chapter
      );
      const chNum = connectGenjiChapters(masterCh, "chapter_ch");
      const genjiTitle = connectGenjiChapters(masterCh, isEn ? "titleen" : "title");
      if (genjiTitle) {
        chapterTitleStr = chNum ? `第${chNum}帖 ${genjiTitle}` : genjiTitle;
      }
    }

    if (!chapterTitleStr) {
      if (isEn) {
        if (typeof ekotoba.titleen === "string" && ekotoba.titleen.trim()) {
          chapterTitleStr = ekotoba.titleen.trim();
        } else if (typeof ekotoba.chapterTitleEn === "string" && ekotoba.chapterTitleEn.trim()) {
          chapterTitleStr = ekotoba.chapterTitleEn.trim();
        } else if (typeof ekotoba.chapteren === "string" && ekotoba.chapteren.trim()) {
          chapterTitleStr = ekotoba.chapteren.trim();
        }
      }
      if (!chapterTitleStr && typeof ekotoba.title === "string" && ekotoba.title.trim()) {
        chapterTitleStr = ekotoba.title.trim();
      } else if (!chapterTitleStr) {
        const rawTitle = ChaptersTitle(
          scrollId,
          scrollTitle,
          ekotoba.chapter,
          isEn ? "titleen" : "title",
          ekotoba.genji_chapter
        );
        if (typeof rawTitle === "string") {
          chapterTitleStr = rawTitle.trim();
        }
      }
    }

    return {
      resolvedChapterTitle: safeString(chapterTitleStr),
    };
  }, [scenes, currentLinkId, scrollId, scrollTitle, isEn]);

  const rawTitleEn =
    safeString(titleen) ||
    safeString(titleEn) ||
    safeString(scrollTitleEn) ||
    safeString(currentScene?.titleen) ||
    safeString(currentScene?.titleEn) ||
    safeString(currentScene?.scrollTitleEn) ||
    "";

  const rawTitleJa =
    safeString(title) ||
    safeString(currentScene?.title) ||
    safeString(emakiTitle) ||
    safeString(scrollTitle);

  const displayTitle = isEn && rawTitleEn ? rawTitleEn : rawTitleJa;

  const displayChapter = isEn
    ? safeString(currentScene?.chapterTitleEn) ||
      safeString(currentScene?.chapteren) ||
      safeString(resolvedChapterTitle)
    : safeString(resolvedChapterTitle);

  // 2. 書き出し・共有フック
  const {
    copiedStep,
    feedbackMessage,
    setFeedbackMessage,
    isShareSheetOpen,
    setIsShareSheetOpen,
    sheetMode,
    setSheetMode,
    shareStep,
    setShareStep,
    isRecording,
    recordingProgress,
    canvasRef,
    resetExportStates,
    getShareTextPayload,
    handleDownload,
    handleShareCopy,
    handleGenerateVideo,
    handleShareVideo,
  } = usePolaroidExport({
    scenes,
    selectedIndex,
    src,
    loadedImagesRef,
    pan,
    zoom,
    coverScale,
    currentTheme,
    displayTitle,
    displayChapter,
    message,
    isEn,
    canShareFiles,
  });

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      resetExportStates();
    }
  }, [isOpen, resetExportStates]);

  // モーダル表示中: body スクロールロックおよび不要な wheel 漏れを遮断
  useEffect(() => {
    if (!isOpen) return;

    // 背景ページの縦スクロールを物理的にロック
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleDocumentWheel = (e) => {
      const isInsidePhoto = frameRef?.current && frameRef.current.contains(e.target);
      // photoFrame 内のホイール操作（ズーム用）以外は、モーダル内外問わずスクロール漏れを抑止
      if (!isInsidePhoto) {
        // カード内テキスト等の縦スクロールを妨げないため、.card 内のスクロール可能要素以外は preventDefault
        const isScrollableCard = e.target.closest?.(`.${styles.card}`);
        if (!isScrollableCard || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("wheel", handleDocumentWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("wheel", handleDocumentWheel, {
        capture: true,
      });
    };
  }, [isOpen, frameRef]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const r = frameW / PHOTO_DW;
  const { prev: prevSlot, current: curSlot, next: nextSlot } = panoramaSlots;
  const cs = coverScale;
  const z = zoom;
  const prevDw = prevSlot?.naturalWidth ? prevSlot.naturalWidth * cs * z * r : 0;
  const curDw = curSlot?.naturalWidth ? curSlot.naturalWidth * cs * z * r : 0;
  const nextDw = nextSlot?.naturalWidth ? nextSlot.naturalWidth * cs * z * r : 0;
  const curDh = curSlot?.naturalHeight ? curSlot.naturalHeight * cs * z * r : 0;
  const prevDh = prevSlot?.naturalHeight ? prevSlot.naturalHeight * cs * z * r : 0;
  const nextDh = nextSlot?.naturalHeight ? nextSlot.naturalHeight * cs * z * r : 0;
  const stripNudgeX = (prevDw - nextDw) / 2;

  const stripTransform =
    curSlot && r > 0
      ? {
          transform: `translate(calc(-50% + ${pan.x * r + stripNudgeX}px), calc(-50% + ${pan.y * r}px))`,
        }
      : undefined;

  const modalContent = (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="polaroid-modal-title"
      style={{ position: "fixed", inset: 0, zIndex: 99999, pointerEvents: "auto" }}
    >
      <button type="button" className={styles.backdrop} aria-label="閉じる" onClick={onClose} style={{ zIndex: 1 }} />
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: THEMES[currentTheme]?.bg || "#ffffff",
          backgroundImage: getThemeTextureUrl(currentTheme) ? `url(${getThemeTextureUrl(currentTheme)})` : "none",
          color: THEMES[currentTheme]?.titleColor || "#111111",
          border: THEMES[currentTheme]?.border ? `1.5px solid ${THEMES[currentTheme].border}` : "1px solid #e5e7eb",
        }}
      >
        <h2 id="polaroid-modal-title" className={styles.srOnly}>
          ポラロイド切り抜き
        </h2>

        {/* プラットフォーム案内バッジ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 8px 8px",
            fontSize: "10px",
            color: "#555",
            flexWrap: "nowrap",
            whiteSpace: "nowrap",
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: "10px", color: "#888", fontWeight: "600", marginRight: "1px" }}>
            {isEn ? "Export for:" : "対応:"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#f0f2f5", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
            𝕏
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#fcefe9", color: "#c13584", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
            {isEn ? "📸 Reels" : "📸 リール"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#ffebee", color: "#d32f2f", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
            ▶️ Shorts
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", background: "#f0f0f0", color: "#111", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>
            TikTok
          </span>
        </div>

        {/* 写真表示フレーム */}
        <div
          ref={frameRef}
          className={styles.photoFrame}
          style={{
            aspectRatio: `${PHOTO_DW} / ${PHOTO_DH}`,
            position: "relative",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={(e) => {
            e.stopPropagation();
            const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
            const zoomFactor = delta < 0 ? 1.08 : 0.92;
            setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.8), 3.0));
          }}
        >
          {src && curSlot && curDw > 0 ? (
            <div className={styles.panoramaStrip} style={stripTransform}>
              {nextSlot ? (
                <img
                  crossOrigin="anonymous"
                  src={nextSlot.src}
                  alt=""
                  className={styles.photoImage}
                  style={{ width: `${nextDw}px`, height: `${nextDh}px`, flexShrink: 0 }}
                  draggable={false}
                />
              ) : null}
              <img
                crossOrigin="anonymous"
                src={curSlot.src}
                alt={currentScene?.name || currentScene?.title || "Emaki Scene"}
                className={styles.photoImage}
                style={{ width: `${curDw}px`, height: `${curDh}px`, flexShrink: 0, pointerEvents: "none" }}
                draggable={false}
              />
              {prevSlot ? (
                <img
                  crossOrigin="anonymous"
                  src={prevSlot.src}
                  alt=""
                  className={styles.photoImage}
                  style={{ width: `${prevDw}px`, height: `${prevDh}px`, flexShrink: 0 }}
                  draggable={false}
                />
              ) : null}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "240px",
                gap: "12px",
                color: "#888",
                fontSize: "13px",
                fontFamily: "'Noto Serif JP', serif",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: "3px solid #e0ded9",
                  borderTopColor: "#b8b2a5",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span>{isEn ? "Loading..." : "読み込み中..."}</span>
              <style jsx>{`
                @keyframes spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
            </div>
          )}

          {src && curSlot ? (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: dragging ? "rgba(0, 0, 0, 0.72)" : "rgba(0, 0, 0, 0.55)",
                color: "#ffffff",
                padding: "3px 8px",
                borderRadius: "14px",
                fontSize: "10px",
                fontWeight: "500",
                pointerEvents: "none",
                backdropFilter: "blur(2px)",
                boxShadow: dragging
                  ? "0 2px 6px rgba(0, 0, 0, 0.35)"
                  : "0 1px 3px rgba(0, 0, 0, 0.2)",
                transition: "background 0.15s ease, box-shadow 0.15s ease",
                zIndex: 2,
              }}
            >
              <span style={{ fontSize: "11px" }}>✥</span>
              <span>{isEn ? "Drag to move" : "ドラッグで移動"}</span>
            </div>
          ) : null}
          <div className={styles.zoomHint}>ドラッグで位置調整・ホイールで拡大縮小</div>
        </div>

        {/* テーマ選択 */}
        <div className={styles.themeSelector} role="radiogroup" aria-label="テーマ選択">
          {Object.values(THEMES).map((th) => (
            <button
              key={th.id}
              type="button"
              className={`${styles.themeDot} ${currentTheme === th.id ? styles.themeDotActive : ""}`}
              style={{
                backgroundColor: th.bg,
                borderColor: currentTheme === th.id ? (th.id === "sumi" ? "#cfa554" : "#2c3e50") : (th.border || "#d1d5db"),
              }}
              onClick={() => setCurrentTheme(th.id)}
              title={`${th.name}テーマ`}
              aria-label={`${th.name}テーマ`}
            />
          ))}
        </div>

        {/* キャプションエリア */}
        <div className={styles.captionArea}>
          {displayChapter && (
            <h3 className={styles.captionTitle} style={{ color: THEMES[currentTheme]?.titleColor }}>
              {isEn ? `— ${displayChapter} —` : `― ${displayChapter} ―`}
            </h3>
          )}
          {displayTitle && (
            <p className={styles.captionSubtitle} style={{ color: THEMES[currentTheme]?.subColor }}>
              {isEn ? `"${displayTitle}"` : `『${displayTitle}』`}
            </p>
          )}

          <div
            style={{
              margin: "10px auto 4px",
              maxWidth: "360px",
              width: "90%",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: message ? "rgba(255, 255, 255, 0.85)" : "#f7f6f2",
                border: message ? "1px solid #d0ccc0" : "1.5px dashed #b8b2a5",
                borderRadius: "8px",
                padding: "5px 10px",
                transition: "all 0.2s ease",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  marginRight: "6px",
                  opacity: 0.65,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                ✏️
              </span>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isEn ? "Add a note (e.g. Favorite scene)" : "ひとこと添える（例: お気に入りのシーン）"}
                maxLength={MESSAGE_MAX}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: "13px",
                  color: THEMES[currentTheme]?.msgColor || "#333",
                  textAlign: "center",
                  fontStyle: message ? "italic" : "normal",
                }}
              />
              {message && (
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#999",
                    padding: "0 2px",
                    lineHeight: 1,
                  }}
                  title="クリア"
                >
                  ✕
                </button>
              )}
            </div>
            {!message && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#999",
                  textAlign: "center",
                  marginTop: "2px",
                }}
              >
                {isEn
                  ? "※ Included as a caption in the image/video (max 40 chars)"
                  : "※画像・動画内に手書きキャプションとして反映されます（最大40文字）"}
              </div>
            )}
          </div>
        </div>

        <div className={styles.cardFooterLine} style={{ color: THEMES[currentTheme]?.creditColor }}>
          <img src="/favicon.ico" alt="" width={12} height={12} style={{ borderRadius: 2, marginRight: 4 }} />
          絵巻物ビューアー | emakimono.com
        </div>

        {(copiedStep || feedbackMessage) && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.725rem",
              textAlign: "center",
              color: copiedStep === "text" ? "#16a34a" : "#2563eb",
            }}
          >
            {feedbackMessage ||
              (copiedStep === "image"
                ? isEn
                  ? "✓ Image copied (paste with Ctrl+V, then tap again to copy caption)"
                  : "✓ 画像をコピーしました（投稿欄に Ctrl+V 貼付後、もう一度押すと本文コピー）"
                : isEn
                ? "✓ Caption and URL copied!"
                : "✓ 本文・URLもコピーしました！")}
          </p>
        )}

        {/* フッター操作ボタン */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => {
              setSheetMode("save");
              setShareStep("select");
              setIsShareSheetOpen(true);
            }}
            disabled={!src}
          >
            {isEn ? "Save" : "保存"}
          </button>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={() => {
              setFeedbackMessage(null);
              setSheetMode("share");
              setShareStep("select");
              setIsShareSheetOpen(true);
            }}
            disabled={!src}
            style={{
              backgroundColor: currentTheme === "sumi" ? "#383533" : "#2c3e50",
            }}
          >
            {isEn ? "Share to SNS / Shorts" : "SNS・Shortsに共有"}
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            {isEn ? "Close" : "閉じる"}
          </button>
        </div>

        {/* 共有・保存シート */}
        {isShareSheetOpen && (
          <div className={styles.shareSheetOverlay}>
            <div className={styles.shareSheetContent}>
              {shareStep === "select" ? (
                <>
                  <div className={styles.shareSheetTitle}>
                    {sheetMode === "save"
                      ? isEn
                        ? "Select Save Format"
                        : "保存の形式を選択"
                      : isEn
                      ? "Select Export Target"
                      : "共有の用途を選択"}
                  </div>
                  {sheetMode === "save" ? (
                    <>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src}
                        onClick={() => {
                          handleDownload("polaroid");
                          setIsShareSheetOpen(false);
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn ? "🖼️ Polaroid Image (4:5)" : "🖼️ ポラロイド画像（4:5）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "Standard aspect ratio for 𝕏 & feed posts" : "X / フィード投稿向け標準比率"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={() => {
                          handleDownload("reel");
                          setIsShareSheetOpen(false);
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn ? "📱 Full Screen (9:16 Photo)" : "📱 縦型フル画面（9:16 静止画）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "For Instagram Reels & Stories" : "Instagram リール・ストーリーズ用"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={handleGenerateVideo}
                        style={{
                          background: isRecording ? "#f0f7ff" : undefined,
                          borderColor: isRecording ? "#90caf9" : undefined,
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isRecording
                            ? isEn
                              ? `🎥 Generating video... (${recordingProgress}%)`
                              : `🎥 動画生成中... (${recordingProgress}%)`
                            : isEn
                            ? "▶️ 5-Sec Loop Video (9:16)"
                            : "▶️ 5秒ループ動画（9:16）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "For YouTube Shorts, Reels & TikTok" : "YouTube Shorts / リール / TikTok用"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src}
                        onClick={() => handleShareCopy("x")}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn
                            ? "𝕏 For X (4:5 image + caption)"
                            : "𝕏 X (Twitter) 用（4:5 画像＋本文）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn
                            ? "Copy polaroid image + caption instructions"
                            : "ポラロイド画像コピー ＋ 投稿テキスト案内"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={() => handleShareCopy("reel")}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn
                            ? "📸 Instagram Reels / Stories (still image)"
                            : "📸 Instagram リール / ストーリーズ（静止画）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn
                            ? "Copy 9:16 vertical image to clipboard"
                            : "9:16 縦型画像のみをクリップボードにコピー"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={handleShareVideo}
                        style={{
                          background: isRecording ? "#f0f7ff" : undefined,
                          borderColor: isRecording ? "#90caf9" : undefined,
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isRecording
                            ? isEn
                              ? `🎥 Generating video... (${recordingProgress}%)`
                              : `🎥 動画生成中... (${recordingProgress}%)`
                            : canShareFiles
                            ? isEn
                              ? "▶️ YouTube Shorts / Reels / TikTok (share video)"
                              : "▶️ YouTube Shorts / リール / TikTok（動画共有）"
                            : isEn
                            ? "▶️ YouTube Shorts / Reels / TikTok (save + caption)"
                            : "▶️ YouTube Shorts / リール / TikTok（動画保存＋本文）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {canShareFiles
                            ? isEn
                              ? "Share 9:16 loop video directly to apps"
                              : "9:16 ループ動画を各アプリへ直接共有"
                            : isEn
                            ? "Save 9:16 loop video and copy caption"
                            : "9:16 ループ動画を保存し、投稿文をコピー"}
                        </span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={styles.shareCancelButton}
                    onClick={() => {
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Cancel" : "キャンセル"}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.shareSheetTitle} style={{ color: "#2e7d32" }}>
                    {isEn ? "✓ Image copied to clipboard" : "✓ 画像をコピーしました"}
                  </div>
                  <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 8px", lineHeight: "1.4" }}>
                    {isEn ? (
                      <>
                        ① Paste the image into your post (Ctrl + V)
                        <br />
                        ② Use the button below to copy and paste the caption
                      </>
                    ) : (
                      <>
                        ① 投稿欄に画像を貼り付け（Ctrl + V）<br />
                        ② 下のボタンで本文をコピーして貼り付けてください
                      </>
                    )}
                  </p>
                  <div
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      color: "#212529",
                      maxHeight: "160px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      textAlign: "left",
                    }}
                  >
                    {getShareTextPayload()}
                  </div>
                  <button
                    type="button"
                    className={styles.shareOptionButton}
                    style={{ justifyContent: "center", background: "#1976d2", color: "#fff", fontWeight: "bold" }}
                    onClick={async () => {
                      const text = getShareTextPayload();
                      await navigator.clipboard.writeText(text);
                      setFeedbackMessage(isEn ? "Caption copied!" : "本文をコピーしました！");
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Copy caption & close" : "本文をコピーして閉じる"}
                  </button>
                  <button
                    type="button"
                    className={styles.shareCancelButton}
                    onClick={() => {
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Close" : "閉じる"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={styles.hiddenCanvas}
        width={FORMATS.reel.canvasW}
        height={FORMATS.reel.canvasH}
        aria-hidden="true"
      />
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}

export default PolaroidModal;
