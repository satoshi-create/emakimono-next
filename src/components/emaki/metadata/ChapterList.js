import { AppContext } from "@/pages/_app";
import styles from "@/styles/ChapterList.module.css";
import { ChaptersTitle, eraColor } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext } from "react";

const ChapterList = ({ data, era, titleen, title, theme_id, scroll_id }) => {
  const { handleChapter } = useContext(AppContext);
  const { locale } = useRouter();
  return (
    <ul className={styles.chapter} style={{ color: eraColor(era) }}>
      {data.map((item, index) => {
        const { cat, chapter } = item;
        if (cat === "scene_title" || cat === "ekotoba") {
          const displayTitle =
            locale === "en"
              ? (item.title_en ?? item.title ?? "")
              : (item.title ?? item.title_en ?? "");
          return (
            <li key={index}>
              <span
                onClick={() => handleChapter(index)}
                className={`${styles[eraColor(era)]} ${styles.chaptername}`}
              >
                {displayTitle || (locale === "en"
                  ? ChaptersTitle(titleen, title, chapter, "titleen", theme_id, scroll_id ?? titleen)
                  : ChaptersTitle(titleen, title, chapter, "title", theme_id, scroll_id ?? titleen))}
              </span>
            </li>
          );
        }
      })}
    </ul>
  );
};

export default ChapterList;
