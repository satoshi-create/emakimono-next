import React, { useContext, useState } from "react";
import styles from "../styles/ChapterDesc.module.css";
import { ChevronDown, ChevronUp } from "react-feather";
import { AppContext } from "../pages/_app";
import Image from "next/image";
import {
  conectKusouzuChapters,
  ChaptersTitle,
  ChaptersDesc,
  ChaptersGendaibun,
} from "../libs/func";


const SingleChapterDesc = ({ item, index, emakis,data }) => {
  const { handleToId, handleFullScreen } = useContext(AppContext);
  const [showInfo, setShowInfo] = useState(false);
  const { chapter, gendaibun, cat, desc } = item;
  const { genjieslug, title } = data;


  return (
    <article className={styles.chapterDesc}>
      <div
        className={styles.chapterDesctTitle}
        onClick={() => setShowInfo(!showInfo)}
      >
        <h4
        // onClick={() => handleToId(index)}
        // className={styles.chapterDesctTitle}
        // style={{ color: eraColor(era) }}
        // dangerouslySetInnerHTML={{ __html: chapter }}
        >
          {ChaptersTitle(title, chapter)}
        </h4>
        <button>
          {showInfo ? <ChevronUp /> : <ChevronDown />}

          {/* <FontAwesomeIcon icon={faPlus} /> */}
        </button>
      </div>
      <div className={styles.line}></div>
      {showInfo && (
        <div className={styles.chapterDesctBody}>
          <p className={styles.chapterDescText}>
            {ChaptersGendaibun(title, chapter, gendaibun)}
          </p>

          <button
            type="button"
            onClick={() => handleToId(index)}
            className={styles.chapterDescbutton}
          >
            横スクロールで見る
          </button>
        </div>
      )}
    </article>
  );
};

export default SingleChapterDesc;
