import React from "react";
import styles from "../styles/Title.module.css";

const Title = ({ pagetitle }) => {
  return <h1 className={`section-center ${styles.title}`}>{pagetitle}</h1>;
};

export default Title;
