import React from "react";
import styles from "../styles/Ekotoba.module.css";

const Ekotoba = ({
  item: { chapter, gendaibun, kobun, index, backgroundImage },
}) => {
  return (
    <section
      className={styles.ekotoba}
      id={`s${index}`}
      style={{ background: `url(${backgroundImage})` }}
    >
      <div className={styles.gendaibun}>
        <h3 dangerouslySetInnerHTML={{ __html: chapter }} />
        <p dangerouslySetInnerHTML={{ __html: gendaibun }} />
      </div>
      <div className={styles.kobun}>
        <p dangerouslySetInnerHTML={{ __html: kobun }} />
      </div>
    </section>
  );
};

export default Ekotoba;
