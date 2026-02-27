import ActionButton from "@/components/emaki/viewer/ActionButton";
import LazyImage from "@/components/emaki/viewer/LazyImage";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersGendaibun, ChaptersTitle } from "@/utils/func";
import {
  faCircleQuestion,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

const OverlayEkotoba = ({
  item: {
    gendaibun: gendaibunProp,
    text,
    content,
    srcSp,
    src,
    config,
    name,
    scroll,
    srcWidth,
    srcHeight,
    width,
    height,
    chapter,
    index,
    navIndex,
    type,
    ekotobaId,
    kotobagaki,
    data,
    googlemap,
    uniqueIndex,
    cat,
    title: itemTitle,
    title_en: itemTitleEn,
  },
  item,
}) => {
  const isSceneTitle = cat === "scene_title";
  // scene_title: item.title / item.title_en。ekotoba: ChaptersTitle または gendaibun
  const gendaibun = gendaibunProp ?? text ?? content ?? "";
  const hasImageUrl = src && src !== "show_original";
  const {
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
    openMapModal,
    openDescModal,
    handleToId,
  } = useContext(AppContext);
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const dataTitle = data?.title;
  const dataTitleen = data?.titleen;

  // TODO : 目次のフォントサイズをレスポンシブにする

  // dangerouslySetInnerHTMLでgendaibunを描画使用するとHydration failedになる問題の対処のため、
  // gendaibunを最初のレンダリング後に取得
  // https://qiita.com/maaaashi/items/957bf8a949833151612b
  const [ekotobabody, setEkotobabody] = useState("");

  useEffect(() => {
    setEkotobabody(gendaibun);
  }, [setEkotobabody, gendaibun]);

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
        (type || data?.type) === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      } ${
        ekotobaImageToggle
          ? `${styles.gendaibunclose}`
          : `${styles.gendaibunopen}`
      } ${styles.container}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      <div
        className={`${styles.gendaibunbox} ${
          !hasImageUrl && styles.noekotobaimage
        } scrollbar`}
      >
        {(chapter || isSceneTitle) && (
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
              {isSceneTitle
                ? (locale === "en" ? (itemTitleEn ?? itemTitle) : (itemTitle ?? itemTitleEn))
                : locale === "en"
                  ? ChaptersTitle(dataTitleen, dataTitle, chapter, "titleen")
                  : ChaptersTitle(dataTitleen, dataTitle, chapter, "title")}
            </h3>
            {!isSceneTitle && (
              <div className={styles.chapterActions}>
                <SceneLikeButton
                  titleen={dataTitleen}
                  title={dataTitle}
                  chapter={chapter}
                  index={index}
                />
                {(type === "浮世絵" && googlemap) || kotobagaki ? (
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
                    {kotobagaki && (
                      <ActionButton
                        icon={
                          <FontAwesomeIcon
                            icon={faCircleQuestion}
                            style={{ fontSize: "1.5em" }}
                          />
                        }
                        label={t("viewer.seeDetailsOfSection")}
                        onClick={() =>
                          openDescModal({
                            ekotobaId,
                            index,
                          })
                        }
                        description={t("viewer.seeDetailsOfSection")}
                        variant="emakipageicon"
                      />
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
        {!isSceneTitle && (
          <p
            className={styles.gendaibun}
            style={{
              fontSize: `${
                orientation === "portrait"
                  ? "var(--text-size-prt)"
                  : "var(--text-size)"
              }`,
            }}
          >
            {ekotobabody && ChaptersGendaibun(dataTitleen, dataTitle, chapter, ekotobabody)}
          </p>
        )}
      </div>
      {hasImageUrl && (
        <div className={styles.ekotobaimagebox}>
          <LazyImage
            key={index}
            src={item}
            alt={name}
            width={srcWidth ?? width}
            height={srcHeight ?? height}
            index={index}
            srcSp={srcSp}
            config={config}
            uniqueIndex={uniqueIndex}
          />
        </div>
      )}
    </div>
  );
};

export default OverlayEkotoba;
