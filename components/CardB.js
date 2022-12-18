import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/CardB.module.css";
import Title from "./Title";
import Image from "next/image";
import { useRouter } from "next/router";
import Button from "./Button";

const CardB = ({
  emakis,
  columns,
  needdesc,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
}) => {
  const { locale } = useRouter();
  return (
    <section
      className={`section-center section-padding ${styles[sectionname]}`}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <section className={styles.conteiner}>
        {emakis.map((item, index) => {
          const { path, name, nameen, src, eracolor } = item;
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
                      <p className={styles.title}>
                        {locale === "en" ? nameen : name}
                      </p>
                    </div>
                  </a>
                </Link>
              </figure>
            </div>
          );
        })}
        <Button
          title={
            locale === "en"
              ? "View a list of EMAKIMONO !!"
              : "絵巻一覧を見る"
          }
          path={"/category/emaki"}
          style={"cardB"}
        />
      </section>
    </section>
  );
};

export default CardB;
