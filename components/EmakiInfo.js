import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiInfo.module.css";
import eraColor from "../libs/func";

const EmakiInfo = ({ type, title, era, typeen, eraen }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <Link href={`/era/${eraen}`}>
        <a className={`${styles[eraColor(era)]} ${styles.era}`}>{era}</a>
      </Link>
      <Link href={`/category/${typeen}`}>
        <a className={styles.type}>{type}</a>
      </Link>
    </div>
  );
};

export default EmakiInfo;
