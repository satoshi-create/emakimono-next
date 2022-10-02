import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/SerchForm.module.css";

const SerchForm = () => {
  const { setQuery } = useContext(AppContext);
  return (
    <>
      <div className={`section-center ${styles.conteiner}`}>
        <form className="input-form">
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
