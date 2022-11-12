import React from "react";
import Title from "./Title";
import styles from "../styles/GridImages.module.css";
import Image from "next/image";
import { gridImages } from "../libs/gridImages";
import Button from "./Button";

const GridImages = ({
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
      <section className={styles.gridconteinter}>
        {gridImages.map((item, index) => {
          const { path, title, image, desc, eracolor } = item;
          return (
            <figure className={styles.figure} key={index}>
              <Image
                src={image}
                layout="fill"
                objectFit="cover"
                className={styles.image}
                sName={styles.image}
                alt={title}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
              <div
                className={`${styles.infocontainer} ${styles[eracolor]}`}
              ></div>
              <div className={styles.info}>
                {/* <p className={styles.title}>{title}</p> */}
                <p className={styles.desc}>{desc}</p>
                <div className={styles.link}>
                  <Button
                    title={"横スクロールで見る"}
                    path={path}
                    style={"gridimage"}
                  />
                </div>
              </div>
            </figure>
          );
        })}
      </section>
    </section>
  );
};

export default GridImages;
