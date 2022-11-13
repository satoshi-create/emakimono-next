import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/CardA.module.css";
import Title from "./Title";
import eraColor from "../libs/func";
import Button from "./Button";
import Image from "next/image";

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
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
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
            tag,
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
              <h4 className={styles.subtype}>
                {sectiontitle === "さまざまな絵巻" && `${subtype}絵巻`}
                {sectiontitle === "横スクロールで楽しむワイド美術" && type}
              </h4>
              <div className={styles.card}>
                <div className={styles.single}>
                  <Link href={`/${titleen}`}>
                    <a>
                      {/* <img src={thumb} loading="lazy" alt={title} /> */}
                      <Image
                        src={thumb}
                        layout="fill"
                        objectFit="responsive"
                        className={styles.image}
                        alt={title}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                      />
                    </a>
                  </Link>
                </div>
                <div className={styles.footer}>
                  <div className={styles.cat}>
                    <Link href={`/category/${typeen}`}>
                      <a className={styles.type}>{type}</a>
                    </Link>
                    <Link href={`/era/${eraen}`}>
                      <a
                        className={`era ${styles[eraColor(era)]} ${styles.era}`}
                      >
                        {era}
                      </a>
                    </Link>
                    <div>3巻</div>
                  </div>
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
                    <Button
                      title={"横スクロールで見る"}
                      path={titleen}
                      style={"carda"}
                    />
                  </div>
                  {tag && (
                    <div className={styles.tag}>
                      {tag.map((item, index) => {
                        const { name, slug } = item;
                        return (
                          <Link href={`/tag/${slug}`} key={index}>
                            <a className={styles.tagLink}>{name}</a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
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
