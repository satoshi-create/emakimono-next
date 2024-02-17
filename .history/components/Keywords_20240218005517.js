import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/Tags.module.css";
import { keywordItem, personnameItem } from "../libs/func";
import { useRouter } from "next/router";
import Button from "./Button";
import { HelpCircle } from "react-feather";
import { faQuestion } from "@fortawesome/fontawesome-svg-core";

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
              // <div
              //   key={index}
              //   className={`${styles.taginfo} ${
              //     locale === "en" && styles.keywordsen
              //   }`}
              // >
              <Link href={`./${path}/${slug}`} key={index}>
                <a className={styles.title}>
                  <p>
                    {locale === "en" ? id : name}
                    <span className={styles.total}>{`(${total})`}</span>
                  </p>
                </a>
              </Link>
              // </div>
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
              // <div
              //   key={index}
              //   className={`${styles.taginfo} ${
              //     locale === "en" && styles.
              //   }`}
              // >
              <Link href={`./${path}/${slug}`} key={index}>
                <a>
                  {portrait ? (
                    <img
                      src={portrait}
                      alt={name}
                      className={styles.portrait}
                    />
                  ) : (
                    <div className={styles.noportrait}>
                      <FontAwesomeIcon icon="fa-solid fa-question" /> 
                      <HelpCircle className={styles.helpcircleicon} />
                    </div>
                  )}
                  <p className={styles.name}>
                    {locale === "en" ? id : name}
                    <span className={styles.totalcount}>{`(${total})`}</span>
                  </p>
                </a>
              </Link>
              // </div>
            );
          })}
        </section>
      </section>
    );
  }
};

export default Keywords;
