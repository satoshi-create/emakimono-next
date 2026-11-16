/**
 * =============================================================================
 * ZoomLayer.jsx — ズーム＆パンの兄弟オーバーレイ
 * =============================================================================
 * 
 * 【アーキテクチャ上の位置付け】
 * <article>（通常横スクロール）の兄弟要素として entry-container 直下に絶対配置される。
 * ビューポート中央付近のスライス帯（前後スライス）を拡大レンダリングし、
 * pointer / wheel / Escape イベントは useEmakiZoomPan 側で捕捉して背景への透過を遮断する。
 *
 * 【主要 Ref の役割】
 * - stageRef: 表示領域（ビューポート実寸）の測定用
 * - stripRef: スライス帯（コンテンツ実寸・現在の transform 適用先）の測定用
 * - data-zoom-strip="true": useEmakiZoomBridge からの DOM 1点サンプリング用識別子
 */
import styles from "@/styles/ZoomLayer.module.css";
import { useTranslation } from "next-i18next";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import SpotPins from "./SpotPins";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_ZOOM_LAYER = true;

function logZoomLayer(tag, ...args) {
  if (!DEBUG_ZOOM_LAYER) return;
  // デバッグログ出力をクリーンアップ
}

const ZoomLayer = ({
  isZoomed,
  scale,
  panX,
  panY,
  zoomRef,
  stageRef,
  stripRef,
  zoomIn,
  zoomOut,
  resetZoom,
  onCapture,
  handlers,
  slices = [],
  // 中心スライスの key（＝絵巻 index）。eager 読み込みの判定に使う
  centerKey,
  onSelectSpot,
  selectedSpotId,
}) => {
  const { t } = useTranslation("common");
  const [showHint, setShowHint] = useState(true);
  const [isSpotEditMode, setIsSpotEditMode] = useState(false);
  const [pickedSpot, setPickedSpot] = useState(null);
  const [spotIdDraft, setSpotIdDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const dragSpotRef = useRef(null);
  const prevTransformRef = useRef({ scale: null, panX: null, panY: null });

  const roundPct = (n) => Math.round(n * 10) / 10;

  const pctFromPointer = (e, el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    const x = roundPct(((e.clientX - rect.left) / rect.width) * 100);
    const y = roundPct(((e.clientY - rect.top) / rect.height) * 100);
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  };

  const commitDragRect = (sliceKey, x0, y0, x1, y1) => {
    const w = roundPct(Math.abs(x1 - x0));
    const h = roundPct(Math.abs(y1 - y0));
    if (w < 1.5 && h < 1.5) {
      setPickedSpot({
        sliceKey,
        x: roundPct(x0),
        y: roundPct(y0),
        w: 24,
        h: 20,
        id: spotIdDraft,
      });
      return;
    }
    const x = roundPct((x0 + x1) / 2);
    const y = roundPct((y0 + y1) / 2);
    setPickedSpot({ sliceKey, x, y, w, h, id: spotIdDraft });
  };

  const copyPickedSpotJson = async () => {
    if (!pickedSpot) return;
    const text = JSON.stringify(
      {
        id: spotIdDraft || pickedSpot.id || "spot-id",
        x: pickedSpot.x,
        y: pickedSpot.y,
        rect: { w: pickedSpot.w, h: pickedSpot.h },
      },
      null,
      2
    );

    const fallbackCopy = () => {
      if (typeof document === "undefined") return false;
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
      return ok;
    };

    let success = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {
      /* fallback */
    }
    if (!success) {
      success = fallbackCopy();
    }
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ---------------------------------------------------------------------------
  // [フロー 1] 操作ヒントバブルの自動消去タイマー（3.2秒）
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSpotEditMode(
      new URLSearchParams(window.location.search).get("editSpots") === "1"
    );
  }, [isZoomed, scale]);

  // ---------------------------------------------------------------------------
  // [フロー 2] ズーム表示状態および Transform の変化監視ログ
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isZoomed) return;

    const prev = prevTransformRef.current;
    if (prev.scale !== scale || prev.panX !== panX || prev.panY !== panY) {
      logZoomLayer("TransformChange", {
        scale: scale?.toFixed(3),
        panX: panX?.toFixed(1),
        panY: panY?.toFixed(1),
        sliceCount: slices.length,
        centerKey,
      });
      prevTransformRef.current = { scale, panX, panY };
    }
  }, [isZoomed, scale, panX, panY, slices.length, centerKey]);

  // 非表示時はレンダリングを完全にスキップ
  if (!isZoomed) return null;

  // ---------------------------------------------------------------------------
  // [フロー 3] 座標・スケールの安全性ガード
  // 初期フレーム等で NaN / 0 が混入しても黒画面・消失にならないようフォールバック
  // ---------------------------------------------------------------------------
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const safePanX = Number.isFinite(panX) ? panX : 0;
  const safePanY = Number.isFinite(panY) ? panY : 0;

  // ---------------------------------------------------------------------------
  // [フロー 4] キャプチャボタン押下ハンドラ（デバッグ計測付き）
  // ---------------------------------------------------------------------------
  const handleCaptureClick = () => {
    if (stripRef?.current) {
      const rect = stripRef.current.getBoundingClientRect();
      const imgs = Array.from(stripRef.current.querySelectorAll("img[data-scene-index]"));
      logZoomLayer("CaptureTriggered", {
        stripRect: { left: rect.left.toFixed(1), width: rect.width.toFixed(1) },
        renderedImages: imgs.map((img) => ({
          sceneIndex: img.dataset.sceneIndex,
          rectLeft: img.getBoundingClientRect().left.toFixed(1),
          rectWidth: img.getBoundingClientRect().width.toFixed(1),
        })),
      });
    }
    if (onCapture) onCapture();
  };

  return (
    <div
      ref={zoomRef}
      className={styles.layer}
      role="dialog"
      aria-modal="true"
      aria-label="Zoom view"
      {...handlers}
    >
      {/* ビューポート測定用ステージ */}
      <div ref={stageRef} className={styles.stage}>
        {/*
          パノラマストリップコンテナ
          - data-zoom-strip="true": useEmakiZoomBridge の handleCaptureFromZoom が
            画面中央と交差するスライスを特定するためのサンプリングターゲット
        */}
        <div
          ref={stripRef}
          data-zoom-strip="true"
          className={styles.strip}
          style={{
            transform: `translate(${safePanX}px, ${safePanY}px) scale(${safeScale})`,
          }}
        >
          {slices.map((s) => {
            const aspectStyle =
              Number.isFinite(s.srcWidth) &&
              s.srcWidth > 0 &&
              Number.isFinite(s.srcHeight) &&
              s.srcHeight > 0
                ? { aspectRatio: `${s.srcWidth} / ${s.srcHeight}` }
                : undefined;

            const preview =
              dragPreview?.sliceKey === s.key ? dragPreview : null;
            const boxFrom = (x0, y0, x1, y1) => ({
              left: Math.min(x0, x1),
              top: Math.min(y0, y1),
              w: Math.abs(x1 - x0),
              h: Math.abs(y1 - y0),
            });
            const previewBox = preview ? boxFrom(preview.x0, preview.y0, preview.x1, preview.y1) : null;
            const pickedOnSlice =
              pickedSpot?.sliceKey === s.key ? pickedSpot : null;
            const pickedBox = pickedOnSlice
              ? boxFrom(
                  pickedOnSlice.x - pickedOnSlice.w / 2,
                  pickedOnSlice.y - pickedOnSlice.h / 2,
                  pickedOnSlice.x + pickedOnSlice.w / 2,
                  pickedOnSlice.y + pickedOnSlice.h / 2
                )
              : null;

            return (
              <div
                key={s.key}
                data-scene-index={s.key}
                style={{
                  position: "relative",
                  display: "inline-block",
                  height: "100%",
                  pointerEvents: "auto",
                  ...aspectStyle,
                }}
              >
                <img
                  data-scene-index={s.key}
                  className={styles.image}
                  src={s.src}
                  alt=""
                  draggable={false}
                  loading={s.key === centerKey ? "eager" : "lazy"}
                  onError={() => {
                    logZoomLayer("ImageLoadError", { key: s.key, src: s.src });
                  }}
                  style={{
                    display: "block",
                    height: "100%",
                    width: "auto",
                    ...aspectStyle,
                  }}
                />
                {s.spots?.length > 0 && (
                  <SpotPins
                    spots={s.spots}
                    linkId={s.linkId}
                    zoomScale={safeScale}
                    onSelectSpot={onSelectSpot}
                    selectedSpotId={selectedSpotId}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isSpotEditMode && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10050,
            background: "rgba(20, 20, 20, 0.92)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
            minWidth: 280,
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!pickedSpot ? (
            <div style={{ fontWeight: 600 }}>
              【Spot ドラッグ編集モード】スポットバッジをドラッグして移動するとJSONが自動保存されます
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Spot picker — slice {pickedSpot.sliceKey}
              </div>
              <div style={{ fontFamily: "monospace", marginBottom: 8 }}>
                x: {pickedSpot.x} · y: {pickedSpot.y} · w: {pickedSpot.w} · h:{" "}
                {pickedSpot.h}
              </div>
              <label style={{ display: "block", marginBottom: 8 }}>
                <span
                  style={{ display: "block", marginBottom: 4, opacity: 0.85 }}
                >
                  Spot id
                </span>
                <input
                  type="text"
                  value={spotIdDraft}
                  onChange={(e) => setSpotIdDraft(e.target.value)}
                  placeholder="spot-id"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "6px 8px",
                    borderRadius: 4,
                    border: "1px solid #555",
                    background: "#111",
                    color: "#fff",
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 8 }}>
                <span
                  style={{ display: "block", marginBottom: 4, opacity: 0.85 }}
                >
                  JSON
                </span>
                <input
                  readOnly
                  value={JSON.stringify(
                    {
                      id: spotIdDraft || pickedSpot.id || "spot-id",
                      x: pickedSpot.x,
                      y: pickedSpot.y,
                      rect: { w: pickedSpot.w, h: pickedSpot.h },
                    },
                    null,
                    2
                  )}
                  onFocus={(e) => e.target.select()}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "6px 8px",
                    borderRadius: 4,
                    border: "1px solid #555",
                    background: "#111",
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: 11,
                  }}
                />
              </label>
              <button
                type="button"
                onClick={copyPickedSpotJson}
                style={{
                  padding: "6px 12px",
                  borderRadius: 4,
                  border: "none",
                  background: "#ff8c77",
                  color: "#141414",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copied ? "コピー済！" : "JSONをコピー"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ズーム操作用フローティングコントロールバー */}
      <div
        className={styles.controls}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {showHint && (
          <div className={styles.hintBubble}>
            {t("viewer.zoomWheelHint")}
          </div>
        )}
        {/* ズームアウトボタン */}
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomOut}
          aria-label="Zoom out"
          title={t("viewer.zoomOutTitle")}
        >
          −
        </button>
        {/* 現在の倍率表示（%） */}
        <span
          className={styles.scaleLabel}
          title={t("viewer.zoomWheelHint")}
          style={{ cursor: "help" }}
        >
          {Math.round(safeScale * 100)}%
        </span>
        {/* ズームインボタン */}
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomIn}
          aria-label="Zoom in"
          title={t("viewer.zoomInTitle")}
        >
          ＋
        </button>
        {/* ポラロイドキャプチャボタン（ズーム中撮影） */}
        {onCapture && (
          <button
            type="button"
            className={styles.controlButton}
            onClick={handleCaptureClick}
            aria-label="Capture polaroid from zoom"
            title={t("viewer.zoomPolaroidCapture")}
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
        )}
        {/* ズーム解除（閉じる）ボタン */}
        <button
          type="button"
          className={styles.controlButton}
          onClick={resetZoom}
          aria-label="Reset zoom"
          title={t("viewer.zoomResetTitle")}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ZoomLayer;