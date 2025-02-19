import React,{useContext} from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/SearchBoxButton.module.css";
import { AppContext } from "../pages/_app";

const SearchBoxButton = () => {
  const { openSearchModalOpen, isSearchModalOpen } = useContext(AppContext);
  return (
    <button className={styles.searchboxbtn} onClick={openSearchModalOpen}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      <span>検索する</span>
    </button>
  );
}

export default SearchBoxButton;
