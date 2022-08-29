import React from "react";
import styles from "../styles/Ekotoba.module.css"

const Ekotoba = ({ item: { chapter, gendaibun, kobun } }) => {
  return (
    <section className={styles.ekotoba}>
      <div className={styles.gendaibun}>
        <h3>{chapter}</h3>
        <p>{gendaibun}</p>
      </div>
      <div className={styles.kobun}>
        <p>{kobun}</p>
      </div>
    </section>
  );
};

export default Ekotoba;
