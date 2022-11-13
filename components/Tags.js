import React from "react";
import Title from "./Title";
import allTags from "../libs/tag";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";

const Tags = () => {
  return (
    <section className={`section-center section-padding ${styles.container}`}>
      <Title sectiontitle={"タグ一覧"} sectiontitleen={"tags"} />
      <section className={styles.tags}>
        {allTags.map((item, index) => {
          const { name, id, slug } = item;
          const total = emakisData.filter((x) => {
            if (x.tag) {
              const filterdTag = x.tag.some((y) => y.slug === slug);
              return filterdTag;
            }
          }).length;
          console.log(total);
          return (
            <div key={index} className={styles.taginfo}>
              <Link href={`./tag/${slug}`}>
                <a className={styles.title}>{name}</a>
              </Link>
              <div className={styles.total}>{`(${total})`}</div>
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default Tags;
