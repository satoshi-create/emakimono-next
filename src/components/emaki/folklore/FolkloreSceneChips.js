/**
 * 現在段に紐づく絵引チップ列（1行横スクロール）。
 * isFolkloreOpen 時のみ SceneCommentaryBar 直上に展開する。
 */
import styles from "@/styles/FolkloreSceneChips.module.css";

const FolkloreSceneChips = ({
  items = [],
  onSelect,
  hidden = false,
  onActivity,
}) => {
  if (hidden || !items.length) return null;

  const bump = () => onActivity?.();

  return (
    <div
      className={styles.row}
      role="list"
      aria-label="絵引（民俗・生活誌）"
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      <span className={styles.label} aria-hidden="true">
        絵引
      </span>
      <div className={styles.chips}>
        {items.map((item) => (
          <button
            key={item.item_id}
            type="button"
            role="listitem"
            className={styles.chip}
            onClick={(e) => {
              e.stopPropagation();
              bump();
              onSelect?.(item);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FolkloreSceneChips;
