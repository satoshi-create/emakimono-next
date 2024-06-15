import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/SearchForm.module.css";

const SearchForm = () => {
  const { setSearchKeyword } = useContext(AppContext);
  return (
    <section className={styles.container}>
      <label htmlFor="search-keyword">Search</label>
      <input
        id="search-keyword"
        className={styles.input}
        type="text"
        onInput={(e) => setSearchKeyword(e.currentTarget.value)}
        placeholder={"Input search keyword"}
      />
    </section>
  );
};

export default SearchForm;
