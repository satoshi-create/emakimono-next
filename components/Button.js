import React from "react";
import styles from "../styles/Button.module.css";
import Link from "next/link";

const Button = ({ value }) => {
  const { style, title, path } = value;
  return (
    <Link href={path}>
      <a>
        <button className={`btn ${styles[style]}`}>{title}</button>
      </a>
    </Link>
  );
};

export default Button;
