import React from "react";
import styles from "../styles/Button.module.css";
import Link from "next/link";

const Button = ({ title, path, style }) => {
  return (
    <Link href={`/${path}`}>
      <a>
        <button className={`btn ${styles.cardbtn} ${styles[style]}`}>
          {title}
        </button>
      </a>
    </Link>
  );
};

export default Button;
