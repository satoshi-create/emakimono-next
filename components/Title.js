import React from "react";
import styles from "../styles/Title.module.css";

const Title = ({ sectiontitle, sectiontitleen }) => {
  return (
    <section className={styles.title}>
      <h3>{sectiontitleen}</h3>
      <h2>{sectiontitle}</h2>
    </section>
  );
};

export default Title;
