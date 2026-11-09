import React from "react";
import styles from "@/styles/PolaroidModal.module.css";
import polaroidAnim from "./PolaroidModal.anim.module.css";

const optionBtnStyle = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  background: "#fafafa",
  padding: "12px 14px",
  textAlign: "left",
  fontSize: "14px",
  color: "#222222",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const cancelBtnStyle = {
  marginTop: "6px",
  width: "100%",
  borderRadius: "8px",
  border: "none",
  background: "transparent",
  padding: "10px",
  textAlign: "center",
  fontSize: "13px",
  color: "#888888",
  cursor: "pointer",
};

/**
 * ポラロイド画像の保存・SNS共有・動画書き出し用ボトムシートダイアログ
 */
export function PolaroidShareSheet({
  isOpen,
  onClose,
  sheetMode,
  shareStep,
  setShareStep,
  src,
  isEn,
  isRecording,
  recordingProgress,
  canShareFiles,
  handleDownload,
  handleShareCopy,
  handleGenerateVideo,
  handleShareVideo,
  getShareTextPayload,
  setFeedbackMessage,
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`${styles.shareSheetOverlay} ${polaroidAnim?.polaroidShareOverlay || ""}`}
    >
      <div
        className={`${styles.shareSheetContent} ${polaroidAnim?.polaroidShareContent || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {shareStep === "select" ? (
          <>
            <div className="mb-1 text-center text-sm font-semibold text-[#333]">
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
                {/* 4:5 ポラロイド静止画保存 */}
                <button
                  type="button"
                  style={optionBtnStyle}
                  disabled={!src}
                  onClick={() => {
                    handleDownload("polaroid");
                    onClose();
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isEn ? "🖼️ Polaroid Image (4:5)" : "🖼️ ポラロイド画像（4:5）"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isEn ? "Standard aspect ratio for 𝕏 & feed posts" : "X / フィード投稿向け標準比率"}
                  </span>
                </button>
                {/* 9:16 縦型フル画面静止画保存 */}
                <button
                  type="button"
                  style={optionBtnStyle}
                  disabled={!src || isRecording}
                  onClick={() => {
                    handleDownload("reel");
                    onClose();
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isEn ? "📱 Full Screen (9:16 Photo)" : "📱 縦型フル画面（9:16 静止画）"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isEn ? "For Instagram Reels & Stories" : "Instagram リール・ストーリーズ用"}
                  </span>
                </button>
                {/* 9:16 5秒ループ動画生成・保存 */}
                <button
                  type="button"
                  disabled={!src || isRecording}
                  onClick={handleGenerateVideo}
                  style={{
                    ...optionBtnStyle,
                    ...(isRecording
                      ? { background: "#f0f7ff", borderColor: "#90caf9" }
                      : {}),
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isRecording
                      ? isEn
                        ? `🎥 Generating video... (${recordingProgress}%)`
                        : `🎥 動画生成中... (${recordingProgress}%)`
                      : isEn
                      ? "▶️ 5-Sec Loop Video (9:16)"
                      : "▶️ 5秒ループ動画（9:16）"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isEn ? "For YouTube Shorts, Reels & TikTok" : "YouTube Shorts / リール / TikTok用"}
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* X (Twitter) 向け画像コピー */}
                <button
                  type="button"
                  style={optionBtnStyle}
                  disabled={!src}
                  onClick={() => handleShareCopy("x")}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isEn
                      ? "𝕏 For X (4:5 image + caption)"
                      : "𝕏 X (Twitter) 用（4:5 画像＋本文）"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isEn
                      ? "Copy polaroid image + caption instructions"
                      : "ポラロイド画像コピー ＋ 投稿テキスト案内"}
                  </span>
                </button>
                {/* Instagram リール向け画像コピー */}
                <button
                  type="button"
                  style={optionBtnStyle}
                  disabled={!src || isRecording}
                  onClick={() => handleShareCopy("reel")}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isEn
                      ? "📸 Instagram Reels / Stories (still image)"
                      : "📸 Instagram リール / ストーリーズ（静止画）"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {isEn
                      ? "Copy 9:16 vertical image to clipboard"
                      : "9:16 縦型画像のみをクリップボードにコピー"}
                  </span>
                </button>
                {/* ショート動画向け動画生成＆共有/保存 */}
                <button
                  type="button"
                  disabled={!src || isRecording}
                  onClick={handleShareVideo}
                  style={{
                    ...optionBtnStyle,
                    ...(isRecording
                      ? { background: "#f0f7ff", borderColor: "#90caf9" }
                      : {}),
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
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
                  <span style={{ fontSize: "12px", color: "#666" }}>
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
              style={cancelBtnStyle}
              onClick={() => {
                onClose();
                setShareStep("select");
              }}
            >
              {isEn ? "Cancel" : "キャンセル"}
            </button>
          </>
        ) : (
          /* クリップボード貼付案内ステップ */
          <>
            <div className="mb-1 text-center text-sm font-semibold text-[#2e7d32]">
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
              style={{
                ...optionBtnStyle,
                justifyContent: "center",
                background: "#1976d2",
                color: "#fff",
                fontWeight: "bold",
              }}
              onClick={async () => {
                const text = getShareTextPayload();
                await navigator.clipboard.writeText(text);
                setFeedbackMessage(isEn ? "Caption copied!" : "本文をコピーしました！");
                onClose();
                setShareStep("select");
              }}
            >
              {isEn ? "Copy caption & close" : "本文をコピーして閉じる"}
            </button>
            <button
              type="button"
              style={cancelBtnStyle}
              onClick={() => {
                onClose();
                setShareStep("select");
              }}
            >
              {isEn ? "Close" : "閉じる"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default PolaroidShareSheet;
