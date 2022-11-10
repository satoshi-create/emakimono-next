import React from "react";
import Title from "./Title";
import styles from "../styles/GridImages.module.css";
import Image from "next/image";
import { gridImages } from "../libs/gridImages";
import Button from "./Button";

const GridImages = () => {
  return (
    <section className={styles.container}>
      <div className={styles.gridconteinter}>
        {gridImages.map((item, index) => {
          const { path, title, image, desc } = item;
          return (
            <figure className={styles.figure} key={index}>
              <Image
                src={image}
                layout="fill"
                objectFit="cover"
                className={styles.image}
                alt={title}
                priority
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
              <div className={styles.info}>
                <p className={styles.title}>{title}</p>
                <p className={styles.desc}>{desc}</p>
                <Button
                  value={{
                    // style: "emakibtn",
                    title: "横スクロールで見る",
                    path: `/${path}`,
                  }}
                />
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
};

export default GridImages;
