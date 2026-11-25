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
  MESSAGE_MAX,
  getThemeTextureUrl,
} from "./polaroid/polaroidCanvasRenderer";
import { PolaroidModalFooter } from "./polaroid/PolaroidModalFooter";
import { PolaroidPreviewFrame } from "./polaroid/PolaroidPreviewFrame";

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
  trackPolaroidSheetOpen,
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
  const [currentTheme, setCurrentTheme] = useState("white"); // ポラロイド台紙テーマ（白、和紙、墨、雅）
  const [layoutMode, setLayoutMode] = useState("polaroid"); // レイアウト形状（polaroid | senmen）
  const [message, setMessage] = useState("");                // 手書き風キャプションメッセージ
  const [isMobileDevice, setIsMobileDevice] = useState(false); // モバイル端末判定（ネイティブ共有用）

  const router = useRouter();
  const locale = router.locale ?? "ja";
  const isJa = locale === "ja";
  const isEn = !isJa;

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
  const resolvedWorkTitleEn =
    titleen || titleEn || scrollTitleEn || scrollId || "";

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
    workTitleEn: resolvedWorkTitleEn,
    frameDomReady,
  });

  const currentScene = scenes[selectedIndex] || scenes[0];
  const rawSrc = currentScene?.src ?? "";
  const src = rawSrc
    ? buildCloudinaryUrl(rawSrc, [], {
        workTitleEn: resolvedWorkTitleEn,
        delivery: currentScene?.delivery,
        r2Key: currentScene?.r2Key,
      })
    : "";

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
    layoutMode,
    displayTitle,
    displayChapter,
    message,
    isEn,
    canShareFiles,
    scrollId,
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

  const rawCx = curDw > 0 ? 50 - (((pan?.x || 0) * r) / curDw) * 100 : 50;
  const rawCy = curDh > 0 ? 50 - (((pan?.y || 0) * r) / curDh) * 100 : 50;
  const cropCx = Math.round(Math.min(100, Math.max(0, rawCx)) * 10) / 10;
  const cropCy = Math.round(Math.min(100, Math.max(0, rawCy)) * 10) / 10;
  const cropCz = Math.round(Math.min(4.6, Math.max(1.2, z)) * 100) / 100;

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

        {/* --- A. ポラロイド / 扇面 モード切替タブ ＋ 閉じるボタン --- */}
        <div
          role="tablist"
          aria-label={isEn ? "Frame Layout Mode" : "レイアウト切替"}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 32px 8px",
          }}
        >
          <button
            type="button"
            className={styles.headerCloseBtn}
            onClick={handleModalClose}
            aria-label={isEn ? "Close" : "閉じる"}
            title={isEn ? "Close" : "閉じる"}
            style={{ position: "absolute", right: 0, top: 0 }}
          >
            ✕
          </button>
          <div
            style={{
              display: "inline-flex",
              background:
                currentTheme === "sumi"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)",
              padding: "3px",
              borderRadius: "999px",
              border:
                currentTheme === "sumi"
                  ? "1px solid rgba(201, 158, 68, 0.35)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
              gap: "3px",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={layoutMode === "polaroid"}
              onClick={() => {
                if (layoutMode !== "polaroid") {
                  setLayoutMode("polaroid");
                }
              }}
              style={{
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background:
                  layoutMode === "polaroid"
                    ? currentTheme === "sumi"
                      ? "#cfa554"
                      : "#ffffff"
                    : "transparent",
                color:
                  layoutMode === "polaroid"
                    ? "#1f2937"
                    : currentTheme === "sumi"
                      ? "rgba(247, 241, 230, 0.75)"
                      : "#4b5563",
                boxShadow:
                  layoutMode === "polaroid"
                    ? "0 1px 3px rgba(0, 0, 0, 0.16)"
                    : "none",
              }}
            >
              {isEn ? "📷 Polaroid" : "📷 ポラロイド"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={layoutMode === "senmen"}
              onClick={() => {
                if (layoutMode !== "senmen") {
                  setLayoutMode("senmen");
                }
              }}
              style={{
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background:
                  layoutMode === "senmen"
                    ? currentTheme === "sumi"
                      ? "#cfa554"
                      : "#ffffff"
                    : "transparent",
                color:
                  layoutMode === "senmen"
                    ? "#1f2937"
                    : currentTheme === "sumi"
                      ? "rgba(247, 241, 230, 0.75)"
                      : "#4b5563",
                boxShadow:
                  layoutMode === "senmen"
                    ? "0 1px 3px rgba(0, 0, 0, 0.16)"
                    : "none",
              }}
            >
              {isEn ? "🪭 Fan Art (Senmen)" : "🪭 扇面"}
            </button>
          </div>
        </div>

        {/* --- B. 写真表示フレーム（切り出しコンポーネント） --- */}
        <PolaroidPreviewFrame
          curDh={curDh}
          curDw={curDw}
          curSlot={curSlot}
          currentScene={currentScene}
          currentTheme={currentTheme}
          dragging={dragging}
          frameRef={frameRef}
          handleFrameWheel={handleFrameWheel}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          isEn={isEn}
          layoutMode={layoutMode}
          nextDh={nextDh}
          nextDw={nextDw}
          nextSlot={nextSlot}
          prevDh={prevDh}
          prevDw={prevDw}
          prevSlot={prevSlot}
          src={src}
          stripTransform={stripTransform}
        />

        {/* --- C. 和紙・墨・雅などのテーマセレクタ（ポラロイド・扇面共通で4色切替） --- */}
        <div className={styles.themeSelector} role="radiogroup" aria-label="テーマ選択">
          {Object.values(THEMES).map((th) => (
            <button
              key={th.id}
              type="button"
              className={`${styles.themeDot} ${currentTheme === th.id ? styles.themeDotActive : ""}`}
              style={{
                backgroundColor: th.bg,
                borderColor:
                  currentTheme === th.id
                    ? th.id === "sumi"
                      ? "#cfa554"
                      : "#2c3e50"
                    : th.border || "#d1d5db",
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
        <div
          className={styles.captionArea}
          style={
            layoutMode === "senmen"
              ? {
                  background: "transparent",
                  marginTop: "4px",
                  paddingTop: "2px",
                }
              : undefined
          }
        >
          {displayChapter && (
            <h3
              className={styles.captionTitle}
              style={{
                color: THEMES[currentTheme]?.titleColor,
                ...(layoutMode === "senmen"
                  ? {
                      background: "transparent",
                      letterSpacing: "0.08em",
                      fontSize: "15px",
                    }
                  : {}),
              }}
            >
              {isEn ? `— ${displayChapter} —` : `― ${displayChapter} ―`}
            </h3>
          )}
          {displayTitle && (
            <p className={styles.captionSubtitle} style={{ color: THEMES[currentTheme]?.subColor }}>
              {isEn ? `"${displayTitle}"` : `『${displayTitle}』`}
            </p>
          )}

          {/* メッセージ ＆ 投稿者名 入力フォーム（横並び） */}
          <div
            style={{
              margin: "8px auto 2px",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                flex: "1 1 62%",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                background: message ? "rgba(255, 255, 255, 0.85)" : "#f7f6f2",
                border: message ? "1px solid #d0ccc0" : "1.5px dashed #b8b2a5",
                borderRadius: "8px",
                padding: "5px 8px",
                transition: "all 0.2s ease",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  marginRight: "5px",
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
                placeholder={
                  isEn
                    ? "Note (max 40 chars)"
                    : "ひとこと添える（40字まで）"
                }
                maxLength={MESSAGE_MAX}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: "12px",
                  color: THEMES[currentTheme]?.msgColor || "#333",
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
                    fontSize: "11px",
                    color: "#999",
                    padding: "0 2px",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  title="クリア"
                >
                  ✕
                </button>
              )}
            </div>

            <div
              style={{
                flex: "0 1 38%",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "5px 8px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  marginRight: "4px",
                  opacity: 0.65,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                👤
              </span>
              <input
                type="text"
                maxLength={40}
                defaultValue={
                  typeof window !== "undefined"
                    ? window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (typeof window !== "undefined") {
                    try {
                      window.localStorage.setItem("emakimono_polaroid_author_v1", val);
                      window.dispatchEvent(new Event("emakimono-author-change"));
                    } catch {}
                  }
                }}
                placeholder={isEn ? "Name (opt.)" : "投稿者名（任意）"}
                aria-label={isEn ? "Author name" : "投稿者名"}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "12px",
                  color: "#0f172a",
                }}
              />
            </div>
          </div>
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

        {/* --- F. フッター操作ボタン（切り出しコンポーネント） --- */}
        <PolaroidModalFooter
          coverScale={coverScale}
          cropCx={cropCx}
          cropCy={cropCy}
          cropCz={cropCz}
          currentTheme={currentTheme}
          displayChapter={displayChapter}
          layoutMode={layoutMode}
          displayTitle={displayTitle}
          isEn={isEn}
          isOpen={isOpen}
          message={message}
          nextSlot={nextSlot}
          pan={pan}
          prevSlot={prevSlot}
          scrollId={scrollId}
          selectedIndex={selectedIndex}
          src={src}
          zoom={zoom}
          onOpenSaveSheet={() => {
            trackPolaroidSheetOpen({
              sheetMode: "save",
              scrollId,
              sceneIndex: selectedIndex,
            });
            setSheetMode("save");
            setShareStep("select");
            setIsShareSheetOpen(true);
          }}
          onOpenShareSheet={() => {
            trackPolaroidSheetOpen({
              sheetMode: "share",
              scrollId,
              sceneIndex: selectedIndex,
            });
            setFeedbackMessage(null);
            setSheetMode("share");
            setShareStep("select");
            setIsShareSheetOpen(true);
          }}
          onCloseModal={handleModalClose}
        />

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