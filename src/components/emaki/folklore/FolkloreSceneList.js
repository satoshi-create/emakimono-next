/**
 * 現在段の絵引アイテム一覧（段一覧と同型のサムネ＋テキストリスト）。
 * SceneCommentaryBar 内で viewMode === "ebiki" のとき本文とスワップ表示する。
 */
import styles from "@/styles/FolkloreSceneList.module.css";

const FolkloreSceneList = ({
  items = [],
  sceneThumb = null,
  onSelect,
  onActivity,
  ariaLabel = "絵引（民俗・生活誌）",
}) => {
  if (!items.length) return null;

  const bump = () => onActivity?.();

  return (
    <nav
      className={styles.list}
      aria-label={ariaLabel}
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      {items.map((item) => {
        const thumb = item.crop_thumb || sceneThumb;
        return (
          <button
            key={item.item_id}
            type="button"
            className={styles.item}
            onClick={(e) => {
              e.stopPropagation();
              bump();
              onSelect?.(item);
            }}
          >
            {thumb ? (
              <img
                className={styles.thumb}
                src={thumb}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className={styles.thumb} aria-hidden="true" />
            )}
            <span className={styles.text}>
              <span className={styles.titleRow}>
                <span className={styles.name}>{item.name}</span>
                {item.act_label ? (
                  <span className={styles.tag}>{item.act_label}</span>
                ) : null}
              </span>
              {item.summary ? (
                <span className={styles.summary}>{item.summary}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default FolkloreSceneList;
