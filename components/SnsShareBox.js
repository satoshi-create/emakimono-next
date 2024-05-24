import React from "react";
import {
  faTwitter,
  faFacebook,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styles from "../styles/SnsShareBox.module.css";

const SnsShareBox = ({ titleen, title, edition, ort }) => {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}`;
  return (
    <div className={`${styles.snsShareBox} ${styles[ort]}`}>
      <Link
        href={`https://twitter.com/share?url=${url}&text=${title} ${
          edition ? edition : ""
        }`}
      >
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faTwitter}
            className={`${styles.snsShareIcon} ${styles.twitter}`}
          />
        </a>
      </Link>
      <Link href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}>
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faFacebook}
            className={`${styles.snsShareIcon} ${styles.facebook}`}
          />
        </a>
      </Link>
      <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}>
        <a target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon
            icon={faLinkedin}
            className={`${styles.snsShareIcon} ${styles.linkedin}`}
          />
        </a>
      </Link>
    </div>
  );
};

export default SnsShareBox;
