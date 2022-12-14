import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../styles/Translate.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import Flag from "react-flagkit";
import { useRouter } from "next/router";

const Translate = ({ footerstyle, emakipage, slug }) => {
  const router = useRouter();
  // console.log(router.pathname);
  // console.log(slug);
  console.log(slug);
  const [toggle, setToggle] = useState(false);

  return (
    <div className={styles.translate} style={emakipage}>
      <button
        onClick={() => setToggle(!toggle)}
        className={`${styles.btn} btn`}
      >
        <FontAwesomeIcon
          icon={faLanguage}
          className={styles.icon}
          style={footerstyle}
        />
      </button>
      <div
        className={styles.menu}
        style={toggle ? { display: "flex" } : { display: "none" }}
      >
        <Link href={`/${slug}`} locale="ja" passHref>
          <a style={footerstyle} onClick={() => setToggle(false)}>
            <Flag country="JP" />
            日本語
          </a>
        </Link>
        <Link href={`/${slug}`} locale="en" passHref>
          <a style={footerstyle} onClick={() => setToggle(false)}>
            <Flag country="US" />
            英語
          </a>
        </Link>
      </div>
    </div>
  );
};

export default Translate;
