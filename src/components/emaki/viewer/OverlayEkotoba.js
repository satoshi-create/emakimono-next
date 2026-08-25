import LazyImage from "@/components/emaki/viewer/LazyImage";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersTitle } from "@/utils/func";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
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
    index,
    navIndex,
    type,
    data,
    uniqueIndex,
  },
  item,
}) => {
  const { scrollDialog, orientation, handleToId } = useContext(AppContext);
  const { locale } = useRouter();
  const { title, titleen } = data;

  return (
    <div
      id={`${index}`}
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      } ${styles.container} ${!src ? styles.noEkotobaImage : ""}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      {chapter && (
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
              ? ChaptersTitle(titleen, title, chapter, "titleen")
              : ChaptersTitle(titleen, title, chapter, "title")}
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
