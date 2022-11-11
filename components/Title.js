import React from "react";
import styles from "../styles/Title.module.css";

const Title = ({ pagetitle }) => {
  return (
    <section className={styles.title}>
      <h2>{pagetitle}</h2>
    </section>
  );
};

export default Title;
