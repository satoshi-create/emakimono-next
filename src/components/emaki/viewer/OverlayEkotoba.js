import LazyImage from "@/components/emaki/viewer/LazyImage";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersTitle } from "@/utils/func";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    ekotobaId,
    kotobagaki,
    sceneText,
    data,
    googlemap,
    uniqueIndex,
  },
  item,
}) => {
  const {
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
    openMapModal,
    handleToId,
  } = useContext(AppContext);
  const { locale } = useRouter();
  const { title, titleen } = data;

  const shareTitle =
    locale === "en"
      ? titleen || title
      : `${title ?? ""}`.trim();

  // TODO : 目次のフォントサイズをレスポンシブにする

  useEffect(() => {
    if (!scroll) {
      setEkotobaImageToggle(true);
    } else {
      setEkotobaImageToggle(false);
    }
    setekotobaToggle(false);
  }, [setEkotobaImageToggle, setekotobaToggle, scroll]);

  const parseEkotobaId = (ekotobaId) => {
    if (ekotobaId) {
      return JSON.parse(ekotobaId);
    }
  };

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
            <div className={styles.chapterActions}>
              <SceneLikeButton
                titleen={titleen}
                title={title}
                chapter={chapter}
                index={index}
              />
              <ShareButtons
                variant="overlay"
                navIndex={index}
                emakiId={titleen}
                shareTitle={shareTitle}
              />
              {(type === "浮世絵" && googlemap) || kotobagaki || sceneText ? (
                <div className={styles.actionButtons}>
                  {type === "浮世絵" && googlemap && (
                    <button
                      className={styles.mapiconlink}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMapModal(ekotobaId);
                      }}
                      title={`${chapter}の場所を地図で確認する`}
                    >
                      <FontAwesomeIcon
                        icon={faLocationDot}
                        className={styles.mapiconlinkicon}
                      />
                    </button>
                  )}
                </div>
              ) : null}
            </div>
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
