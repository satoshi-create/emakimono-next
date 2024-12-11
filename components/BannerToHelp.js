import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import styles from "../styles/BannerToHelp.module.css";

const BannerToHelp = () => {
  return (
    <Link href="https://note.com/enjoy_emakimono/n/n449f765b4876">
      <a target="_blank"  rel="noopener noreferrer" className={styles.banner}>
        <i>
          <FontAwesomeIcon icon={faCircleQuestion} title="絵巻の見方" />
        </i>
        <p>絵巻の見方</p>
      </a>
    </Link>
  );
};

export default BannerToHelp;
