/**
 * 絵引トグルボタン。コメンタリーバー下部ツールバーに常設し、
 * 絵引リスト（サムネ付き）の開閉と件数バッジを担う。
 */
import styles from "@/styles/FolkloreToggleButton.module.css";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const FolkloreToggleButton = ({
  count = 0,
  open = false,
  onToggle,
  label,
  disabled = false,
}) => {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      className={`${styles.btn} ${open ? styles.btnActive : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-pressed={open}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <FontAwesomeIcon icon={faTags} />
      <span className={styles.badge} aria-hidden="true">
        {count}
      </span>
    </button>
  );
};

export default FolkloreToggleButton;
