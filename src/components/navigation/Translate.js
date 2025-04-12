import styles from "@/styles/Translate.module.css";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import Flag from "react-flagkit";

const Translate = ({ footerstyle, emakipage, slug }) => {
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
        <Link href={`/${slug ? slug : ""}`} locale="ja">
          <a style={footerstyle} onClick={() => setToggle(false)}>
            <Flag country="JP" />
            日本語
          </a>
        </Link>
        <Link href={`/${slug ? slug : ""}`} locale="en">
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
