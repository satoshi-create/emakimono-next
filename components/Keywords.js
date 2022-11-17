import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";
import { keywordItem, personnameItem } from "../libs/func";

const Keywords = ({ sectiontitle, sectiontitleen, allTags, path }) => {

  if (sectiontitle === "キーワード") {
    return (
      <section className={`section-center section-padding ${styles.container}`}>
        <section className={styles.tags}>
          {keywordItem(emakisData).map((item, index) => {
            const { name, id, slug, total } = item;

            return (
              <div key={index} className={styles.taginfo}>
                <Link href={`./${path}/${slug}`}>
                  <a className={styles.title}>{name}</a>
                </Link>
                <div className={styles.total}>{`(${total})`}</div>
              </div>
            );
          })}
        </section>
      </section>
    );
  } else {
    return (
      <section className={`section-center section-padding ${styles.container}`}>
        <section className={styles.tags}>
          {personnameItem(emakisData).map((item, index) => {
            const { name, id, slug, total } = item;

            return (
              <div key={index} className={styles.taginfo}>
                <Link href={`./${path}/${slug}`}>
                  <a className={styles.title}>{name}</a>
                </Link>
                <div className={styles.total}>{`(${total})`}</div>
              </div>
            );
          })}
        </section>
      </section>
    );
  }
};

export default Keywords;
