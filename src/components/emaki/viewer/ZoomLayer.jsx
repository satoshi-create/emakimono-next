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
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef } from "react";
import { ALL_QUIZZES } from "@/data/quiz/index";
import {
  usePanoramaSpots,
  mapPanoramaSpotsToStrip,
} from "@/hooks/emaki/usePanoramaSpots";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import SpotPins from "./SpotPins";
import { resolveScrollSpotConfig } from "./spotPins/resolveScrollSpotConfig";

// =============================================================================
// デバッグスイッチ（検証完了後は false にして一括停止）
// =============================================================================
const DEBUG_ZOOM_PAN_SYNC = false;

function logDebug(tag, ...args) {
  if (!DEBUG_ZOOM_PAN_SYNC) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
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
  data,
  ebikiPickerEnabled = false,
  onSelectSpot,
  selectedSpotId,
  isLtr = false,
}) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const stripClassName = isLtr
    ? `${styles.strip} ${styles.stripLtr}`
    : styles.strip;
  const isEditSpotsMode =
    process.env.NODE_ENV === "development" && router.query.editSpots === "1";

  // [1] 状態管理 (State)
  const [showHint, setShowHint] = useState(true);
  const prevTransformRef = useRef({ scale: null, panX: null, panY: null });

  const stopIfSpotLikeControl = (e) => {
    if (e.target?.closest?.("button")) {
      e.stopPropagation();
    }
  };

  // [2] 同期・副作用 (Effects)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // [3] パノラマ座標写像 (Pure Logic)
  const quizQuestions = useMemo(() => {
    const scrollKey = data?.scroll_id ?? data?.titleen;
    const quizDef =
      scrollKey &&
      ALL_QUIZZES.find(
        (q) => q.titleen === scrollKey || q.id === scrollKey
      );
    return Boolean(quizDef) && quizDef?.questions ? quizDef.questions : [];
  }, [data]);

  const { panoramaSpots } = usePanoramaSpots(
    data,
    quizQuestions
  );
  const spotConfig = useMemo(
    () => resolveScrollSpotConfig(data),
  [data]
  );
  const usePanoramaStripSpots = spotConfig.usePanoramaStrip;

  const mappedStripSpots = useMemo(
    () => mapPanoramaSpotsToStrip(panoramaSpots, data?.emakis, slices, data?.readingDirection),
    [panoramaSpots, data?.emakis, slices]
  );

  useEffect(() => {
    if (!isZoomed) return;

    const prev = prevTransformRef.current;
    if (prev.scale === scale && prev.panX === panX && prev.panY === panY) return;

    const rafId = requestAnimationFrame(() => {
      const stripEl = stripRef.current;
      const pinLayerEl = stripEl?.querySelector?.("[data-spotpins-layer]");
      const firstSliceEl = stripEl?.querySelector?.("[data-scene-index]");
      logDebug("ZOOM:panSync", {
        scale,
        panX,
        panY,
        stripTransform: stripEl?.style?.transform,
        stripRect: stripEl?.getBoundingClientRect?.(),
        stripClientWidth: stripEl?.clientWidth,
        stripScrollWidth: stripEl?.scrollWidth,
        pinLayerRect: pinLayerEl?.getBoundingClientRect?.(),
        firstSliceRect: firstSliceEl?.getBoundingClientRect?.(),
        sampleSpot: mappedStripSpots?.[0]
          ? {
              id: mappedStripSpots[0].id,
              x: mappedStripSpots[0].x,
              y: mappedStripSpots[0].y,
            }
          : null,
      });
    });

    prevTransformRef.current = { scale, panX, panY };
    return () => cancelAnimationFrame(rafId);
  }, [isZoomed, scale, panX, panY, mappedStripSpots, stripRef]);

  const panoramaLinkId = data?.linkId ?? slices[0]?.linkId;

  // [4] ビューポート・キャンバス描画 (View)
  // 非表示時はレンダリングを完全にスキップ
  if (!isZoomed) return null;
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
      logDebug("CaptureTriggered", {
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
          className={stripClassName}
          style={{
            position: "relative",
            width: "max-content",
            minWidth: "100%",
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
                onPointerDown={stopIfSpotLikeControl}
                onPointerUp={stopIfSpotLikeControl}
                onTouchStart={stopIfSpotLikeControl}
                onTouchEnd={stopIfSpotLikeControl}
              >
                <img
                  data-scene-index={s.key}
                  className={styles.image}
                  src={s.src}
                  alt=""
                  draggable={false}
                  loading={s.key === centerKey ? "eager" : "lazy"}
                  onError={() => {
                    if (process.env.NODE_ENV !== "production") {
                      console.warn("[ZoomLayer] ImageLoadError", { key: s.key, src: s.src });
                    }
                  }}
                  style={{
                    display: "block",
                    height: "100%",
                    width: "auto",
                    ...aspectStyle,
                  }}
                />
                {!usePanoramaStripSpots &&
                  (s.spots?.length > 0 || isEditSpotsMode) && (
                  <SpotPins
                    spots={s.spots ?? []}
                    linkId={s.linkId}
                    zoomScale={safeScale}
                    data={data}
                    ebikiPickerEnabled={ebikiPickerEnabled}
                    onSelectSpot={onSelectSpot}
                    selectedSpotId={selectedSpotId}
                    masterSpots={spotConfig.masterSpots}
                    getSpotKindClass={spotConfig.getSpotKindClass}
                  />
                )}
              </div>
            );
          })}
          {(usePanoramaStripSpots || isEditSpotsMode) && (
            <SpotPins
              spots={mappedStripSpots}
              isPanorama
              linkId={panoramaLinkId}
              zoomScale={safeScale}
              data={data}
              ebikiPickerEnabled={ebikiPickerEnabled}
              onSelectSpot={onSelectSpot}
              selectedSpotId={selectedSpotId}
              masterSpots={spotConfig.masterSpots}
              getSpotKindClass={spotConfig.getSpotKindClass}
            />
          )}
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