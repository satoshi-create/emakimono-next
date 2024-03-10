import React from "react";
import Link from "next/link";
import styles from "../styles/Breadcrumbs.module.css";

const Breadcrumbs = ({ name, test, testen }) => {
  return (
    <section
      className={`section-center section-grid section-padding ${styles.breadcrumbs}`}
    >
      <ul className={styles.container}>
        <Link href={"/"}>
          <a>Top</a>
        </Link>

        {test && (
          <>
            <p>{">"}</p>
            <Link href={`/${testen}`}>
              <a>{test}</a>
            </Link>
          </>
        )}

        <p> {" > "} </p>
        <p>{name}</p>
      </ul>
    </section>
  );
};

export default Breadcrumbs;
