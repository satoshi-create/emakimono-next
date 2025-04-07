import Link from "next/link";
import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Button.module.css";

const Button = ({ title, path, style }) => {

  return (
    <Link href={path}>
      <a className={styles.link}>
        <button
          className={`btn ${styles.btn} ${styles[style]}`}
          // onClick={() => handleFullScreen("landscape")}
        >
          {title}
        </button>
      </a>
    </Link>
  );
};

export default Button;
