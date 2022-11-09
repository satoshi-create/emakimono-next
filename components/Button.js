import React from "react";
import styles from "../styles/Button.module.css";
import Link from "next/link";

const Button = ({ value }) => {
  const { style, title, path } = value;
  return (
    <Link href={path}>
      <a className={style}>
        <button className={`btn ${styles.cmnbtn}`}>{title}</button>
      </a>
    </Link>
  );
};

export default Button;
