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

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_ZOOM_LAYER = true;

function logZoomLayer(tag, ...args) {
  if (!DEBUG_ZOOM_LAYER) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][ZoomLayer:${tag}]`, "color: #0ea5e9; font-weight: bold;", ...args);
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
}) => {
  const { t } = useTranslation("common");
  const [showHint, setShowHint] = useState(true);
  const prevTransformRef = useRef({ scale: null, panX: null, panY: null });

  // ---------------------------------------------------------------------------
  // [フロー 1] 操作ヒントバブルの自動消去タイマー（3.2秒）
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

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
          {slices.map((s) => (
            <img
              key={s.key}
              data-scene-index={s.key}
              className={styles.image}
              src={s.src}
              alt=""
              draggable={false}
              loading={s.key === centerKey ? "eager" : "lazy"}
              onError={() => {
                logZoomLayer("ImageLoadError", { key: s.key, src: s.src });
              }}
              /*
                実幅のインライン指定は廃止。CSS の height:100% + width:auto に
                aspect-ratio を渡し、レンダリング側で正確な幅を自動計算させる
                （ロード前でも幅が確定し、strip.offsetWidth が 0 へ潰れない）。
              */
              style={
                Number.isFinite(s.srcWidth) &&
                s.srcWidth > 0 &&
                Number.isFinite(s.srcHeight) &&
                s.srcHeight > 0
                  ? { aspectRatio: `${s.srcWidth} / ${s.srcHeight}` }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

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