import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";

const Keywords = ({ sectiontitle, sectiontitleen, allTags, path }) => {
  const convert = (arr) => {
    const res = {};
    arr.forEach((obj) => {
      const key = `${obj.name}`;
      if (!res[key]) {
        res[key] = { ...obj, total: 0 };
      }
      res[key].total += 1;
    });
    return Object.values(res);
  };

  const keywordItem = convert(
    emakisData.flatMap((item) => item.keyword).filter((item) => item)
  ).sort((a, b) => (a.total > b.total ? -1 : 1));

  const personnameItem = convert(
    emakisData.flatMap((item) => item.personname).filter((item) => item)
  ).sort((a, b) => (a.total > b.total ? -1 : 1));
  console.log(personnameItem);

  if (sectiontitle === "キーワード") {
    return (
      <section className={`section-center section-padding ${styles.container}`}>
        <section className={styles.tags}>
          {keywordItem.map((item, index) => {
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
          {personnameItem.map((item, index) => {
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
