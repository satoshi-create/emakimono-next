import React, { useContext } from "react";
import index from "../pages";
import { AppContext } from "../pages/_app";
import styles from "../styles/SerchForm.module.css";

const SerchForm = ({ emakis }) => {
  const { setQuery } = useContext(AppContext);

  return (
    <>
      <div className={`section-center ${styles.conteiner}`}>
        <form className={styles.input} onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="search..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </>
  );
};

export default SerchForm;
