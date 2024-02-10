import React from "react";
import Title from "./Title";
import styles from "../styles/GridImages.module.css";
import Button from "./Button";
import { useRouter } from "next/router";
import GridImageCard from "./GridImageCard";

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

 
  const GridImagesData = (slice) => {
    if (slice) {
      const slicedGridImages = state.gridImages.slice(0, 5);
      return slicedGridImages;
    } else {
      return state.gridImages;
    }
  };

  return (
    <div style={{ background: bcg }}>
      <section
        className={`section-center section-padding ${styles[sectionname]}`}
      >
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
        <div className={styles.gridconteinter}>
          {GridImagesData(slice).map((item, index) => {
            return <GridImageCard item={item} key={index} />;
          })}
        </div>
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
