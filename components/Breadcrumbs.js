import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Breadcrumbs.module.css";

const Breadcrumbs = ({ type, title, titleen, typeen }) => {

  return (
    <ol className={styles.container}>
      <Link href={"/"}>
        <a>Top</a>
      </Link>
      {" > "}
      <Link href={`/category/${typeen}`}>
        <a>{type}</a>
      </Link>
      {" > "}
      <Link href={`/${typeen}/${titleen}`}>
        <a>{title}</a>
      </Link>
      {/* {paths.map((x, i) => (
        <>
          {">"}
          <Link href={roots[i + 1]} key={i}>
            <a>{x}</a>
          </Link>
        </>
      ))} */}
      {/* {lists.map((list, index) => {
        const { name, path } = list;
        return (
          <li key={index}>
            <Link href={path}>
              <a>{name}</a>
            </Link>
          </li>
        );
      })}
      {">"}
      {title} */}
    </ol>
  );
};

export default Breadcrumbs;
