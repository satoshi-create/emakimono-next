import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/CardA.module.css";
import Title from "./Title";
import eraColor from "../libs/func";

const CardA = ({
  emakis,
  columns,
  needdesc,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
}) => {
  return (
    <section
      className={`section-center section-padding ${styles[sectionname]}`}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <p className={styles.sectiondesc}>{sectiondesc}</p>
      <section className={styles.conteiner}>
        {emakis.map((item, index) => {
          const {
            titleen,
            title,
            thumb,
            edition,
            author,
            era,
            eraen,
            desc,
            typeen,
            type,
            subtype,
            data,
          } = item;
          const filterDesc = desc.substring(0, 40);
          const descTemp = `${title} ${
            author && `（${author}）`
          }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

          return (
            <div
              className={`${styles.cardContainer} ${styles[columns]}`}
              key={index}
            >
              <h4>
                {sectiontitle === "さまざまな絵巻" && `${subtype}絵巻`}
                {sectiontitle === "横スクロールで楽しむワイド美術" && type}
              </h4>
              <div className={styles.card}>
                <Link href={`/${titleen}`}>
                  <a>
                    <div className={styles.single}>
                      <img src={thumb} loading="lazy" alt={title} />
                    </div>
                  </a>
                </Link>
                <div className={styles.footer}>
                  <h3 className={styles.title}>
                    {title}　{edition}
                  </h3>
                  <h4 className={styles.author}>
                    {author ? author : "絵師不明"}
                  </h4>
                  {needdesc && (
                    <div className={styles.desc}>
                      {desc ? `${filterDesc}...` : descTemp}
                    </div>
                  )}
                  <div className={styles.viewemaki}>
                    <Link href={`/${titleen}`}>
                      <a className={styles.link}>横スクロールで見る</a>
                    </Link>
                  </div>
                </div>
                <div className={styles.tag}>
                  <Link href={`/category/${typeen}`}>
                    <a>{type}</a>
                  </Link>
                  <Link href={`/era/${eraen}`}>
                    <a className={`era ${eraColor(era)} ${styles.era}`}>{era}</a>
                  </Link>
                  <div>3巻</div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default CardA;
