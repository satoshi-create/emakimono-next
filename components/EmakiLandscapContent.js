import React from "react";
import EmakiConteiner from "./EmakiConteiner";
import styles from "../styles/EmakiLandscapContent.module.css";

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
  height,
}) => {
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
        <p>aside components</p>
      </div>
    </div>
  );
};

export default EmakiLandscapContent;
