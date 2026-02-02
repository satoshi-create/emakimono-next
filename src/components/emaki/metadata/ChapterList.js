import { AppContext } from "@/pages/_app";
import styles from "@/styles/ChapterList.module.css";
import { ChaptersTitle, eraColor } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext } from "react";

const ChapterList = ({ data, era, titleen, title }) => {
  const { handleChapter } = useContext(AppContext);
  const { locale } = useRouter();
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
                {locale === "en"
                  ? ChaptersTitle(titleen, title, chapter, "titleen")
                  : ChaptersTitle(titleen, title, chapter, "title")}
              </span>
            </li>
          );
        }
      })}
    </ul>
  );
};

export default ChapterList;
