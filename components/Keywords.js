import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";

const Keywords = ({ sectiontitle, sectiontitleen, allTags, path }) => {
  return (
    <section className={`section-center section-padding ${styles.container}`}>
      {/* <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} /> */}
      <section className={styles.tags}>
        {allTags.map((item, index) => {
          const { name, id, slug } = item;

          const totalKeyword = emakisData.filter((x) => {
            if (x.keyword) {
              const filterdTag = x.keyword.some((y) => y.slug === slug);
              return filterdTag;
            }
          }).length;

          const totalPersonname = emakisData.filter((x) => {
            if (x.personname) {
              const filterdTag = x.personname.some((y) => y.slug === slug);
              return filterdTag;
            }
          }).length;
          console.log(totalPersonname);
          return (
            <div key={index} className={styles.taginfo}>
              <Link href={`./${path}/${slug}`}>
                <a className={styles.title}>{name}</a>
              </Link>
              <div className={styles.total}>
                {path === "keyword" ? `(${totalKeyword})` : `(${totalPersonname})`}
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default Keywords;
