import React, { useContext } from "react";
import Link from "next/link";
import styles from "../styles/EmakiInfo.module.css";
import eraColor from "../libs/func";
import { AppContext } from "../pages/_app";

const EmakiInfo = ({ type, title, era, typeen, eraen }) => {
  const { openModal } = useContext(AppContext);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <Link href={`/era/${eraen}`}>
        <a className={`${eraColor(era)} ${styles.era}`}>{era}</a>
      </Link>
      <Link href={`/category/${typeen}`}>
        <a className={styles.type}>{type}</a>
      </Link>
      <div onClick={openModal}>?</div>
    </div>
  );
};

export default EmakiInfo;