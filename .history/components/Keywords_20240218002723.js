import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";
import { keywordItem, personnameItem } from "../libs/func";
import { useRouter } from "next/router";
import Button from "./Button";

console.log(emakisData);

const Keywords = ({ sectiontitle, path }) => {
  const { locale } = useRouter();
  if (sectiontitle === "キーワード") {
    return (
      <section className={`section-center section-padding ${styles.container}`}>
        <section
          className={`${styles.tags} ${locale === "ja" && styles.jatags}`}
        >
          {keywordItem(emakisData).map((item, index) => {
            const { name, id, slug, total, ruby } = item;

            return (
              <div
                key={index}
                className={`${styles.taginfo} ${
                  locale === "en" && styles.keywordsen
                }`}
              >
                <Link href={`./${path}/${slug}`}>
                  <a className={styles.title}>{locale === "en" ? id : name}</a>
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
        <section
          className={`${styles.tags} ${locale === "ja" && styles.jatags}`}
        >
          {personnameItem(emakisData).map((item, index) => {
            const { name, id, slug, total, ruby, portrait } = item;
            return (
              <div
                key={index}
                className={`${styles.taginfo} ${
                  locale === "en" && styles.personnames
                }`}
              >
                {portrait && <img src={portrait} alt={name} />}
                <Link href={`./${path}/${slug}`}>
                  <a className={styles.title}>
                    {locale === "en" ? id : name}
                    {/* <ruby>
                      <rb>{name}</rb>
                      <rp>（</rp>
                      <rt>{ruby && ruby}</rt>
                      <rp>）</rp>
                    </ruby> */}
                  </a>
                  <span className={styles.total}>{`(${total})`}</span>
                </Link>
              </div>
            );
          })}
        </section>
      </section>
    );
  }
};

export default Keywords;
