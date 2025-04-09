import { ChaptersTitle, eraColor } from "@/libs/func";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/ChapterList.module.css";
import { useContext } from "react";

const ChapterList = ({ data, era, titleen, title }) => {
  const { handleChapter } = useContext(AppContext);
  return (
    <ul className={styles.chapter} style={{ color: eraColor(era) }}>
      {data.map((item, index) => {
        const { cat, chapter } = item;
        if (cat === "ekotoba") {
          return (
            <li key={index}>
              <span
                onClick={() => handleChapter(index)}
                className={`${styles[eraColor(era)]} ${styles.chaptername}`}
              >
                {ChaptersTitle(titleen, title, chapter)}
              </span>
            </li>
          );
        }
      })}
    </ul>
  );
};

export default ChapterList;
