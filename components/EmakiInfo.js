import React, { useContext } from "react";
import Link from "next/link";
import styles from "../styles/EmakiInfo.module.css";
import { eraColor } from "../libs/func";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

const EmakiInfo = ({ type, title, era, typeen, eraen }) => {
  const { openModal } = useContext(AppContext);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <Link href={`/era/${eraen}`}>
        <a className={`${eraColor(era)} ${styles.era}`}>{`${era}時代`}</a>
      </Link>
      <Link href={`/category/${typeen}`}>
        <a className={styles.type}>{type}</a>
      </Link>
      <div onClick={openModal} className={styles.question}>
        <FontAwesomeIcon icon={faCircleQuestion} />
      </div>
    </div>
  );
};

export default EmakiInfo;
