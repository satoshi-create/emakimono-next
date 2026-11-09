/**
 * =============================================================================
 * File: PolaroidModal.js
 * 
 * 【責務】
 * ポラロイド写真風の切り抜きビューアを表示するUIシェルコンポーネント。
 * 低レイヤーの幾何計算・エクスポート・メタデータ解決・スクロールロックは
 * それぞれ専用のカスタムフックに委譲し、本ファイルはUIツリーの構成と
 * スタイリングに特化しています。
 * 
 * 【主要な委譲先フック・コンポーネント】
 * - usePolaroidPanZoom: 前後3スライス読み込み、ドラッグ/ホイールによるPan・Zoom制御
 * - usePolaroidChapterMetadata: 詞書・章タイトル・作品名などのメタデータ逆引き解決
 * - usePolaroidExport: Canvasオフスクリーン描画、画像保存、動画生成、SNS共有
 * - usePolaroidScrollLock: モーダル表示中の背面スクロール固定とwheelイベント漏洩防止
 * - PolaroidShareSheet: 共有・保存のフォーマット選択ボトムシートUI
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import styles from "@/styles/PolaroidModal.module.css";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

// --- レンダリング定数・カラーテーマ ---
import {
  THEMES,
  FORMATS,
  PHOTO_DW,
  PHOTO_DH,
  MESSAGE_MAX,
  getThemeTextureUrl,
} from "./polaroid/polaroidCanvasRenderer";

// --- 分割・抽出された責務別カスタムフック ---
import { usePolaroidPanZoom } from "./polaroid/usePolaroidPanZoom";
import { usePolaroidExport } from "./polaroid/usePolaroidExport";
import { usePolaroidChapterMetadata } from "./polaroid/usePolaroidChapterMetadata";
import { usePolaroidScrollLock } from "./polaroid/usePolaroidScrollLock";

// --- サブUIコンポーネント ---
import { PolaroidShareSheet } from "./polaroid/PolaroidShareSheet";
import {
  trackPolaroidClose,
  trackPolaroidThemeChange,
} from "@/libs/api/measurementUtils";

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
  // ---------------------------------------------------------------------------
  // 1. ローカルUIステート & ルーター情報
  // ---------------------------------------------------------------------------
  const [currentTheme, setCurrentTheme] = useState("white"); // ポラロイド台紙テーマ（和紙、墨、雅など）
  const [message, setMessage] = useState("");                // 手書き風キャプションメッセージ
  const [isMobileDevice, setIsMobileDevice] = useState(false); // モバイル端末判定（ネイティブ共有用）

  const router = useRouter();
  const locale = router.locale ?? "ja";
  const isEn = locale === "en";

  // モバイル端末判定（navigator.share を利用可能か判断）
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

  // モーダルクローズ時の計測イベント発火
  const handleModalClose = () => {
    trackPolaroidClose({ scrollId });
    onClose();
  };

  // クライアントマウント後のみ Portal 描画（SSR ハイドレーション回避）
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const frameDomReady = mounted && isOpen;

  // ---------------------------------------------------------------------------
  // 2. Pan / Zoom & パノラマ画像ロード（usePolaroidPanZoom）
  // ---------------------------------------------------------------------------
  const {
    selectedIndex,
    zoom,
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
    handleFrameWheel,
  } = usePolaroidPanZoom({
    isOpen,
    scenes,
    initialIndex,
    initialZoom,
    initialPan,
    frameDomReady,
  });

  const currentScene = scenes[selectedIndex] || scenes[0];
  const rawSrc = currentScene?.src ?? "";
  const src = rawSrc ? buildCloudinaryUrl(rawSrc) : "";

  // ---------------------------------------------------------------------------
  // 3. メタデータ解決（usePolaroidChapterMetadata）
  //    - 詞書（ekotoba）から最も近い章タイトルや源氏物語の帖名を逆引き
  // ---------------------------------------------------------------------------
  const { displayTitle, displayChapter } = usePolaroidChapterMetadata({
    scenes,
    currentScene,
    scrollId,
    scrollTitle,
    title,
    emakiTitle,
    titleen,
    titleEn,
    scrollTitleEn,
    isEn,
  });

  // ---------------------------------------------------------------------------
  // 4. 書き出し・保存・SNS共有制御（usePolaroidExport）
  // ---------------------------------------------------------------------------
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

  // モーダルが閉じられた際のエクスポート状態初期化
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      resetExportStates();
    }
  }, [isOpen, resetExportStates]);

  // ---------------------------------------------------------------------------
  // 5. 背面スクロールロック & wheel 漏洩防止（usePolaroidScrollLock）
  // ---------------------------------------------------------------------------
  usePolaroidScrollLock({ isOpen, frameRef });

  // 非表示またはSSR時は何もレンダリングしない
  if (!isOpen || !mounted) return null;

  // ---------------------------------------------------------------------------
  // 6. パノラマストリップの物理寸法 & Transform 計算
  // ---------------------------------------------------------------------------
  // 基準幅（PHOTO_DW: 960px）に対する現在の写真枠幅のスケール比
  const r = frameW / PHOTO_DW;
  const { prev: prevSlot, current: curSlot, next: nextSlot } = panoramaSlots;
  const cs = coverScale;
  const z = zoom;

  // 各スライスの実描画ピクセル幅・高さ
  const prevDw = prevSlot?.naturalWidth ? prevSlot.naturalWidth * cs * z * r : 0;
  const curDw = curSlot?.naturalWidth ? curSlot.naturalWidth * cs * z * r : 0;
  const nextDw = nextSlot?.naturalWidth ? nextSlot.naturalWidth * cs * z * r : 0;
  const curDh = curSlot?.naturalHeight ? curSlot.naturalHeight * cs * z * r : 0;
  const prevDh = prevSlot?.naturalHeight ? prevSlot.naturalHeight * cs * z * r : 0;
  const nextDh = nextSlot?.naturalHeight ? nextSlot.naturalHeight * cs * z * r : 0;

  // 前後画像の幅差による中央補正量（絵巻は右から左に進むため）
  const stripNudgeX = (prevDw - nextDw) / 2;

  // ストリップ全体の配置（中央基準 + Pan移動 + 幅差補正）
  const stripTransform =
    curSlot && r > 0
      ? {
          transform: `translate(calc(-50% + ${pan.x * r + stripNudgeX}px), calc(-50% + ${pan.y * r}px))`,
        }
      : undefined;

  // ---------------------------------------------------------------------------
  // 7. モーダル本体の JSX 構造
  // ---------------------------------------------------------------------------
  const modalContent = (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="polaroid-modal-title"
      style={{ position: "fixed", inset: 0, zIndex: 99999, pointerEvents: "auto" }}
    >
      {/* 背景クリック用バックドロップ */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="閉じる"
        onClick={handleModalClose}
        style={{ zIndex: 1 }}
      />

      {/* ポラロイドカード本体 */}
      <div
        data-polaroid-card="true"
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

        {/* --- A. プラットフォーム案内バッジ --- */}
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

        {/* --- B. 写真表示フレーム（ドラッグ/ホイール操作対象） --- */}
        <div
          ref={frameRef}
          data-polaroid-frame
          className={`relative aspect-[960/1280] max-h-[52vh] w-full flex-1 min-h-0 overflow-hidden bg-neutral-900/5 select-none touch-none ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleFrameWheel}
        >
          {src && curSlot && curDw > 0 ? (
            /* パノラマストリップ（RTL順: next -> cur -> prev） */
            <div className={styles.panoramaStrip} style={stripTransform}>
              {/* 絵巻の進行方向（左側: 次スライス） */}
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
              {/* 中央スライス */}
              <img
                crossOrigin="anonymous"
                src={curSlot.src}
                alt={currentScene?.name || currentScene?.title || "Emaki Scene"}
                className={styles.photoImage}
                style={{ width: `${curDw}px`, height: `${curDh}px`, flexShrink: 0, pointerEvents: "none" }}
                draggable={false}
              />
              {/* 絵巻の進行方向（右側: 前スライス） */}
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
            /* ローディングスピナー */
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

          {/* ドラッグ操作ヒントバッジ */}
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

        {/* --- C. 和紙・墨・雅などのテーマセレクタ --- */}
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
              onClick={() => {
                if (currentTheme !== th.id) {
                  trackPolaroidThemeChange({ theme: th.id, scrollId });
                  setCurrentTheme(th.id);
                }
              }}
              title={`${th.name}テーマ`}
              aria-label={`${th.name}テーマ`}
            />
          ))}
        </div>

        {/* --- D. キャプション & ひとこと入力エリア --- */}
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

          {/* メッセージ入力フォーム */}
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

        {/* --- E. クレジット表記 --- */}
        <div className={styles.cardFooterLine} style={{ color: THEMES[currentTheme]?.creditColor }}>
          <img src="/favicon.ico" alt="" width={12} height={12} style={{ borderRadius: 2, marginRight: 4 }} />
          絵巻物ビューアー | emakimono.com
        </div>

        {/* コピー結果通知トースト */}
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

        {/* --- F. フッター操作ボタン（保存 / 共有 / 閉じる） --- */}
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
          <button type="button" className={styles.closeBtn} onClick={handleModalClose}>
            {isEn ? "Close" : "閉じる"}
          </button>
        </div>

        {/* --- G. 共有・保存ボトムシート（切り出しコンポーネント） --- */}
        <PolaroidShareSheet
          isOpen={isShareSheetOpen}
          onClose={() => setIsShareSheetOpen(false)}
          sheetMode={sheetMode}
          shareStep={shareStep}
          setShareStep={setShareStep}
          src={src}
          isEn={isEn}
          isRecording={isRecording}
          recordingProgress={recordingProgress}
          canShareFiles={canShareFiles}
          handleDownload={handleDownload}
          handleShareCopy={handleShareCopy}
          handleGenerateVideo={handleGenerateVideo}
          handleShareVideo={handleShareVideo}
          getShareTextPayload={getShareTextPayload}
          setFeedbackMessage={setFeedbackMessage}
        />
      </div>

      {/* --- H. Canvas描画用（非表示 Offscreen Canvas） --- */}
      <canvas
        ref={canvasRef}
        className={styles.hiddenCanvas}
        width={FORMATS.reel.canvasW}
        height={FORMATS.reel.canvasH}
        aria-hidden="true"
      />
    </div>
  );

  // React Portal を使って document.body 直下にレンダリング
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}

export default PolaroidModal;