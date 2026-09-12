/**
 * ZoomLayer — ズーム＆パンの兄弟オーバーレイ。
 *
 * <article>（横スクロール）の兄弟要素として entry-container 直下に絶対配置される。
 * 現在ビューポート中央付近の帯（前後スライス）を表示し、pointer / wheel / Escape は
 * useEmakiZoomPan 側で stopPropagation して背後へ透過させない。
 */
import styles from "@/styles/ZoomLayer.module.css";

const ZoomLayer = ({
  isZoomed,
  scale,
  panX,
  panY,
  zoomRef,
  zoomIn,
  zoomOut,
  resetZoom,
  handlers,
  slices = [],
}) => {
  if (!isZoomed) return null;

  return (
    <div
      ref={zoomRef}
      className={styles.layer}
      role="dialog"
      aria-modal="true"
      aria-label="Zoom view"
      {...handlers}
    >
      <div className={styles.stage}>
        <div
          className={styles.strip}
          style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
        >
          {slices.map((s) => (
            <img
              key={s.key}
              className={styles.image}
              src={s.src}
              alt=""
              draggable={false}
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
        <span className={styles.scaleLabel}>{Math.round(scale * 100)}%</span>
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
