import React, { useContext, useState } from "react";
import styles from "../styles/EmakiLandscapContent.module.css";
import { eraColor, ChaptersTitle } from "../libs/func";
import { AppContext } from "../pages/_app";

const ChapterTimeline = ({ index, titleen, title, chapter, era }) => {
  const { handleToId} =
    useContext(AppContext);

  return (
    <li>
      <span
        onClick={() => handleToId(index)}
        className={styles.chapterlink}
        style={{ color: eraColor(era) }}
      >
        {ChaptersTitle(titleen, title, chapter)}
      </span>
    </li>
  );
};

export default ChapterTimeline;
