/**
 * 現在段に紐づく絵引チップ列（1行横スクロール）。
 * isFolkloreOpen 時のみ SceneCommentaryBar 直上に展開する。
 */
import styles from "@/styles/FolkloreSceneChips.module.css";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const FolkloreSceneChips = ({
  items = [],
  onSelect,
  hidden = false,
  onActivity,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  if (hidden || !items.length) return null;

  const bump = () => onActivity?.();

  return (
    <div
      className={styles.row}
      role="list"
      aria-label={t("viewer.folkloreListAria")}
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      <span className={styles.label} aria-hidden="true">
        {t("viewer.folkloreChipLabel")}
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
            {isEn && item.name_en ? item.name_en : item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FolkloreSceneChips;
