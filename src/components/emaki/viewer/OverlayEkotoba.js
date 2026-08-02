import LazyImage from "@/components/emaki/viewer/LazyImage";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersTitle } from "@/utils/func";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

const OverlayEkotoba = ({
  item: {
    src,
    config,
    name,
    scroll,
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
  const {
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
    handleToId,
  } = useContext(AppContext);
  const { locale } = useRouter();
  const { title, titleen } = data;

  // TODO : 目次のフォントサイズをレスポンシブにする

  useEffect(() => {
    if (!scroll) {
      setEkotobaImageToggle(true);
    } else {
      setEkotobaImageToggle(false);
    }
  }, [setEkotobaImageToggle, scroll]);

  return (
    <div
      id={`${index}`}
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      } ${
        ekotobaImageToggle
          ? `${styles.gendaibunclose}`
          : `${styles.gendaibunopen}`
      } ${styles.container}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      <div
        className={`${styles.gendaibunbox} ${
          !src && styles.noekotobaimage
        } scrollbar`}
      >
        {chapter && (
          <div
            className={`${styles.chapterbox} ${
              orientation === "portrait" ? styles.chapterboxPrt : styles.chapterboxLand
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
          </div>
        )}
      </div>
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
