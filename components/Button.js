import React, { useContext } from "react";
import styles from "../styles/Button.module.css";
import Link from "next/link";
import { AppContext } from "../pages/_app";

const Button = ({ title, path, style }) => {
  const { handleFullScreen } = useContext(AppContext);

  return (
    <Link href={`/${path}`}>
      <a className={styles.link}>
        <button
          className={`btn ${styles.btn} ${styles[style]}`}
          onClick={() => handleFullScreen("landscape")}
        >
          {title}
        </button>
      </a>
    </Link>
  );
};

export default Button;
