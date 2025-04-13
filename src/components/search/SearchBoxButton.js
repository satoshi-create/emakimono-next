import { AppContext } from "@/pages/_app";
import styles from "@/styles/SearchBoxButton.module.css";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useContext } from "react";

const SearchBoxButton = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { openSearchModalOpen, isSearchModalOpen } = useContext(AppContext);
  return (
    <button className={styles.searchboxbtn} onClick={openSearchModalOpen}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      <span>{t("search")}</span>
    </button>
  );
};

export default SearchBoxButton;
