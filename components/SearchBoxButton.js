import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/SearchBoxButton.module.css";

const SearchBoxButton = () => {
  const { locale } = useRouter();
  const { openSearchModalOpen, isSearchModalOpen } = useContext(AppContext);
  return (
    <button className={styles.searchboxbtn} onClick={openSearchModalOpen}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      <span>{locale == "en" ? "Search" : "検索する"}</span>
    </button>
  );
};

export default SearchBoxButton;
