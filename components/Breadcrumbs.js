import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Breadcrumbs.module.css";

const Breadcrumbs = ({ name, test, testen }) => {
  return (
    <section className={`section-center ${styles.breadcrumbs}`}>
      <ul className={styles.container}>
        <Link href={"/"}>
          <a>Top</a>
        </Link>
        {" > "}
        {test && <Link href={`/${testen}`}>{test}</Link>}
        {" > "}
        {name}
      </ul>
    </section>
  );
};

export default Breadcrumbs;
