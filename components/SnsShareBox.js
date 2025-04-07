import {
  faFacebook,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";
import styles from "../styles/SnsShareBox.module.css";

const SnsShareBox = ({ titleen, title, edition, ort, chapter, index }) => {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}`;

  const urlpart = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}%23${index}`;
  const twitter = () => {
    if (ort === "modal") {
      return `https://twitter.com/share?url=${urlpart}&text=${title} ${chapter}`;
    } else {
      return `https://twitter.com/share?url=${url}&text=${title} ${
        edition ? edition : ""
      }`;
    }
  };

  return (
    <div className={`${styles.snsShareBox} ${styles[ort]}`}>
      <Link href={twitter(ort)}>
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faTwitter}
            className={`${styles.snsShareIcon} ${styles.twitter} ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}>
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faFacebook}
            className={`${styles.snsShareIcon} ${styles.facebook}  ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}>
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faLinkedin}
            className={`${styles.snsShareIcon} ${styles.linkedin}  ${styles[ort]}`}
          />
        </a>
      </Link>
    </div>
  );
};

export default SnsShareBox;
