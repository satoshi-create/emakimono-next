import React from "react";
import Link from "next/link";
import styles from "../styles/EmakiBreadcrumbs.module.css";

const EmakiBreadcrumbs = ({ nameA, nameAen, nameB, orientation }) => {
  return (
    <section
      className={`${orientation === "portrait" && styles.prt}  ${
        styles.container
      }`}
    >
      <ul className={styles.breadcrumbs}>
        <Link href={"/"}>
          <a>
            <p>home</p>
          </a>
        </Link>

        {nameA && (
          <>
            <p>{">"}</p>
            <Link href={`/${nameAen}`}>
              <a>
                <p>{nameA}</p>
              </a>
            </Link>
          </>
        )}

        <p> {">"} </p>
        <p>{nameB}</p>
      </ul>
    </section>
  );
};

export default EmakiBreadcrumbs;
