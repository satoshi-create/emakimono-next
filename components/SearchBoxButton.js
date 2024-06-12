import React from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/SearchBoxButton.module.css";

const SearchBoxButton = () => {
  return (
    <button className={styles.searchboxbtn}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      <span>...input search</span>
    </button>
  );
}

export default SearchBoxButton