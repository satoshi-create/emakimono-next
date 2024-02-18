import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/CardB.module.css";
import Title from "./Title";
import Image from "next/image";
import { useRouter } from "next/router";
import Button from "./Button";

const CardB = ({
  columns,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
  bcg,
}) => {
  const { locale } = useRouter();

  const historyemakis = [
    {
      path: "/era/heiann",
      name: "平安",
      nameen: "heian",
      src: "/cyoujyuu_yamazaki_kou_13-375.webp",
      eracolor: "orange",
    },
    {
      path: "/era/kamakura",
      name: "鎌倉",
      nameen: "kamakura",
      src: "/naomoto_03-1080.webp",
      eracolor: "green",
    },
    {
      path: "/era/muromachi",
      name: "室町",
      nameen: "muromachi",
      src: "/sessyu_sikisansuizu_07-1080.webp",
      eracolor: "purple",
    },
    {
      path: "/era/aduchimomoyama",
      name: "安土・桃山",
      nameen: "aduchimomoyama",
      src: "/unryuzu_01-1080.webp",
      eracolor: "gold",
    },
    {
      path: "/era/edo",
      name: "江戸",
      nameen: "edo",
      src: "/tokugawagyouretsu_32-1080.webp",
      eracolor: "skyblue",
    },
    {
      path: "/era/meiji",
      name: "明治",
      nameen: "meiji",
      src: "/yoroboushi_01-1080.webp",
      eracolor: "firebrick",
    },
  ];
  return (
    <section
      className={`section-grid section-padding`}
      style={{ background: bcg }}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <section className={styles.conteiner}>
        {historyemakis.map((item, index) => {
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
                      objectFit="cover"
                      // width={533}
                      // height={300}
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
            locale === "en" ? "View a list of EMAKIMONO !!" : "絵巻一覧を見る"
          }
          path={"/category/emaki"}
          style={"cardB"}
        />
      </section>
    </section>
  );
};

export default CardB;
