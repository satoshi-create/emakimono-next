import React, { useContext } from "react";
import EmakiConteiner from "./EmakiConteiner";
import styles from "../styles/EmakiLandscapContent.module.css";
import { AppContext } from "../pages/_app";

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
  height,
}) => {
  const { handleToId } = useContext(AppContext);
  const { emakis } = data;
  return (
    <div className={`emaki-page-landscape-grid`}>
      <div className={styles.wrapper}>
        <EmakiConteiner
          data={{ ...data }}
          scroll={true}
          selectedRef={selectedRef}
          navIndex={navIndex}
          articleRef={articleRef}
          height={height}
        />
        <ul className={styles.chapter}>
          <h4 className={styles.chapterTitle}>目次</h4>
          <span className={styles.chapterBorderline}></span>
          {emakis.map((item, index) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li key={index}>
                  <span
                    onClick={() => handleToId(index)}
                    className={styles.chapterlink}
                    dangerouslySetInnerHTML={{ __html: chapter }}
                  ></span>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </div>
  );
};

export default EmakiLandscapContent;
