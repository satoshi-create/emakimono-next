import React, { useContext,useState } from 'react'
import styles from "../styles/EmakiLandscapContent.module.css";
import { ChevronDown, ChevronUp } from "react-feather";
import { AppContext } from "../pages/_app";
import Image from "next/image";

const SingleChapterDesc = ({item,index,emakis}) => {
    const { handleToId, handleFullScreen } = useContext(AppContext);
  const [showInfo, setShowInfo] = useState(false);
  const { chapter, gendaibun, cat } = item
  console.log(emakis[1].srcSp);
  
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
          dangerouslySetInnerHTML={{ __html: chapter }}
        ></h4>
        <button>
          {showInfo ? <ChevronUp /> : <ChevronDown />}

          {/* <FontAwesomeIcon icon={faPlus} /> */}
        </button>
      </div>
      <div className={styles.line}></div>
      {showInfo && (
        <div className={styles.chapterDesctBody}>
          <p
            className={styles.chapterDescText}
            dangerouslySetInnerHTML={{
              __html: gendaibun,
            }}
          ></p>
          <button
            type="button"
            onClick={() => handleToId(index)}
            className={`${styles.chapterDescbutton} ${styles.linkedbutton}`}
          >
            横スクロールで見る
          </button>
          {/* <figure className={styles.chapterDesctImageBox}>
            <Image
              onClick={() => handleToId(index)}
              src={"/kusouzu_01-375.webp"}
              width={200}
              height={200}
              className={styles.chapterDesctImage}
              alt={name}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
            />
          </figure> */}
        </div>
      )}
    </article>
  );
}

export default SingleChapterDesc