import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SearchBoxButton.module.css";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import { useContext } from "react";

const SearchBoxButton = ({ variant = "default" }) => {
  const { t } = useTranslation("common");
  const { openSearchModalOpen } = useContext(AppContext);
  const isIconOnly = variant === "iconOnly";

  return (
    <button
      className={`${styles.searchboxbtn} ${isIconOnly ? styles.iconOnly : ""}`}
      onClick={openSearchModalOpen}
      aria-label={t("search")}
      type="button"
    >
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      {!isIconOnly && <span>{t("search")}</span>}
    </button>
  );
};

export default SearchBoxButton;
