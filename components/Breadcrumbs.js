import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Breadcrumbs.module.css";

const Breadcrumbs = ({ name }) => {
  return (
    <section className="section-center">
      <ul className={styles.container}>
        <Link href={"/"}>
          <a>Top</a>
        </Link>
        {" > "}
        {name}
      </ul>
    </section>
  );
};

export default Breadcrumbs;
