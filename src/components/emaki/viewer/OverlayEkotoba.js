import LazyImage from "@/components/emaki/viewer/LazyImage";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersTitle } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext } from "react";

const OverlayEkotoba = ({
  item: {
    src,
    config,
    name,
    srcWidth,
    srcHeight,
    chapter,
    genji_chapter: genjiChapter,
    index,
    navIndex,
    data,
    uniqueIndex,
  },
  item,
}) => {
  const { scrollDialog, orientation, handleToId, chapterToggle } =
    useContext(AppContext);
  const { locale } = useRouter();
  const { title, titleen } = data;

  return (
    <div
      className={`section ${styles.ekotobarl} ${styles.container} ${
        !src ? styles.noEkotobaImage : ""
      }`}
      style={src ? { width: "100%", height: "100%" } : undefined}
      ref={navIndex === index ? scrollDialog : null}
    >
      {chapter && chapterToggle && (
        <div
          className={`${styles.chapterbox} ${
            orientation === "portrait"
              ? styles.chapterboxPrt
              : styles.chapterboxLand
          }`}
        >
          <h3
            className={`${styles.chapter} ${
              orientation === "portrait" ? styles.chapterPrt : styles.chapterLand
            }`}
            onClick={() => handleToId(index)}
          >
            {locale == "en"
              ? ChaptersTitle(titleen, title, chapter, "titleen", genjiChapter)
              : ChaptersTitle(titleen, title, chapter, "title", genjiChapter)}
          </h3>
          <div className={styles.chapterActions}>
            <SceneLikeButton
              titleen={titleen}
              title={title}
              chapter={chapter}
              index={index}
              variant="overlay"
            />
          </div>
        </div>
      )}
      {src && (
        <div className={styles.ekotobaimagebox}>
          <LazyImage
            key={index}
            src={item}
            alt={name}
            width={srcWidth}
            height={srcHeight}
            config={config}
            uniqueIndex={uniqueIndex}
          />
        </div>
      )}
    </div>
  );
};

export default OverlayEkotoba;
