import React, { useState, useReducer, useContext, useEffect } from "react";
import Title from "./Title";
import styles from "../styles/GridImages.module.css";
import Image from "next/image";
import Button from "./Button";
import { useRouter } from "next/router";

const GridImages = ({
  images,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
  linktitle,
  linktitleen,
  linkpath,
  columns,
  bcg,
  slice,
}) => {
  const { locale } = useRouter();

  const init = {
    gridImages: images,
  };

  const enterImage = (id) => {
    dispatch({ type: "ENTERIMAGE", payload: id });
  };
  const leaveImage = (id) => {
    dispatch({ type: "LEAVEIMAGE", payload: id });
  };
  const reducer = (state, action) => {
    if (action.type === "ENTERIMAGE") {
      let tempgridImages = state.gridImages.map((item) => {
        if (item.id === action.payload) {
          return { ...item, bln: true };
        }
        return item;
      });
      return { gridImages: tempgridImages };
    }
    if (action.type === "LEAVEIMAGE") {
      let tempgridImages = state.gridImages.map((item) => {
        if (item.id === action.payload) {
          return { ...item, bln: false };
        }
        return item;
      });
      return { gridImages: tempgridImages };
    }
  };

  const [state, dispatch] = useReducer(reducer, init);

  const GridImagesList = (slice) => {
    if (slice) {
      const slicedGridImages = state.gridImages.slice(0.5);
      return slicedGridImages;
    } else {
      return state.gridImages;
    }
  };

  console.log(state.gridImages.slice(0.5));

  const gridImages = (
    <div className={styles.gridconteinter}>
      {GridImagesList(slice).map((item, index) => {
        const { path, title, image, desc, eracolor, id, bln, descen } = item;
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
            <div
              className={styles.info}
              onMouseOver={() => enterImage(id)}
              onMouseOut={() => leaveImage(id)}
            >
              {bln ? (
                <div className={styles.link}>
                  <Button
                    title={"横スクロールで見る"}
                    path={path}
                    style={"gridimage"}
                  />
                </div>
              ) : (
                <p className={styles.desc}>{locale === "en" ? descen : desc}</p>
              )}
            </div>
          </figure>
        );
      })}
    </div>
  );

  return (
    <div style={{ background: bcg }}>
      <section
        className={`section-center section-padding ${styles[sectionname]}`}
      >
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
        {gridImages}
        {linktitle && (
          <Button
            title={
              locale === "en"
                ? `More flowing ${linktitleen} !!`
                : `${linktitle}をもっと見る`
            }
            path={`/${linkpath}`}
            style={columns}
          />
        )}
      </section>
    </div>
  );
};

export default GridImages;
