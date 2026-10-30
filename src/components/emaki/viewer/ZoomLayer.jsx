/**
 * ZoomLayer — ズーム＆パンの兄弟オーバーレイ。
 *
 * <article>（横スクロール）の兄弟要素として entry-container 直下に絶対配置される。
 * 現在ビューポート中央付近の帯（前後スライス）を表示し、pointer / wheel / Escape は
 * useEmakiZoomPan 側で stopPropagation して背後へ透過させない。
 *
 * stageRef / stripRef は useEmakiZoomPan に可動域（content 実寸 / viewport 実寸）を
 * 測らせるための実測用 ref。
 */
import styles from "@/styles/ZoomLayer.module.css";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

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
  handlers,
  slices = [],
  // 中心スライスの key（＝絵巻 index）。eager 読み込みの判定に使う
  centerKey,
}) => {
  const { t } = useTranslation("common");
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  if (!isZoomed) return null;

  // 初期フレーム等で NaN / 0 が混入しても黒画面・消失にならないよう補正する
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const safePanX = Number.isFinite(panX) ? panX : 0;
  const safePanY = Number.isFinite(panY) ? panY : 0;

  return (
    <div
      ref={zoomRef}
      className={styles.layer}
      role="dialog"
      aria-modal="true"
      aria-label="Zoom view"
      {...handlers}
    >
      <div ref={stageRef} className={styles.stage}>
        <div
          ref={stripRef}
          className={styles.strip}
          style={{
            transform: `translate(${safePanX}px, ${safePanY}px) scale(${safeScale})`,
          }}
        >
          {slices.map((s) => (
            <img
              key={s.key}
              className={styles.image}
              src={s.src}
              alt=""
              draggable={false}
              loading={s.key === centerKey ? "eager" : "lazy"}
              onLoad={(e) =>
                console.log(
                  "[zoom-slice-loaded]",
                  e.currentTarget.naturalWidth,
                  e.currentTarget.currentSrc
                )
              }
              onError={(e) =>
                console.warn("[zoom-slice-err]", e.currentTarget.currentSrc)
              }
              // 実幅のインライン指定は廃止。CSS の height:100% + width:auto に
              // aspect-ratio を渡し、レンダリング側で正確な幅を自動計算させる
              // （ロード前でも幅が確定し、strip.offsetWidth が 0 へ潰れない）。
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
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomOut}
          aria-label="Zoom out"
          title={t("viewer.zoomOutTitle")}
        >
          −
        </button>
        <span
          className={styles.scaleLabel}
          title={t("viewer.zoomWheelHint")}
          style={{ cursor: "help" }}
        >
          {Math.round(safeScale * 100)}%
        </span>
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomIn}
          aria-label="Zoom in"
          title={t("viewer.zoomInTitle")}
        >
          ＋
        </button>
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
