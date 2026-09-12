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
}) => {
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
              loading="eager"
            />
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className={styles.scaleLabel}>{Math.round(safeScale * 100)}%</span>
        <button
          type="button"
          className={styles.controlButton}
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          ＋
        </button>
        <button
          type="button"
          className={styles.controlButton}
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ZoomLayer;
