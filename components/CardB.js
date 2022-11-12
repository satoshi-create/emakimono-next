import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/CardB.module.css";
import Title from "./Title";
import eraColor from "../libs/func";
import Image from "next/image";

const CardB = ({
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
          const { path, name, src, eracolor } = item;
          console.log(eracolor);
          return (
            <div
              className={`${styles.cardContainer} ${styles[columns]}`}
              key={index}
            >
              <figure className={styles.card} key={index}>
                <Link href={path}>
                  <a>
                    <Image
                      src={src}
                      layout="fill"
                      objectFit="responsive"
                      className={styles.image}
                      alt={name}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                    />
                    <div className={`${styles.info} ${styles[eracolor]}`}>
                      <p className={styles.title}>{name}</p>
                    </div>
                  </a>
                </Link>
              </figure>
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default CardB;
