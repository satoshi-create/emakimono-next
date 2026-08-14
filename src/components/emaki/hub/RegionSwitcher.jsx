import styles from "@/styles/EmakiHub.module.css";

/**
 * 京都編 / 鎌倉編の切替タブ。
 * 選択状態は URL クエリ `?region=` で保持する（共有・GA計測向き）。
 */
const RegionSwitcher = ({ regions, currentRegion, onChange, t }) => {
  return (
    <div className={styles.regionSwitch} role="tablist" aria-label="Region">
      {regions.map((region) => {
        const { id, labelJa, labelEn } = region;
        const active = id === currentRegion;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.regionTab} ${active ? styles.regionTabActive : ""}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.regionTabJa}>{labelJa}</span>
            <span className={styles.regionTabEn}>{labelEn}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RegionSwitcher;
