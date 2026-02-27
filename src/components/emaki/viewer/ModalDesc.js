import SnsShareBox from "@/components/social/SnsShareBox";
import * as gtag from "@/libs/api/gtag";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/ModalDesc.module.css";
import { ChaptersDesc, ChaptersTitle, ChaptersGendaibun } from "@/utils/func";
import {
  faAnglesLeft,
  faAnglesRight,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

const ModalDesc = ({ data }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const { DescIndex, setDescIndex, handleToId, closeDescModal, orientation } =
    useContext(AppContext);
  const emakis = data.emakis;
  const { genjieslug, title, titleen } = data;

  const filterEkotobas = emakis
    .map((item, index) => ({ ...item, index }))
    .filter(
      (item) =>
        item.cat === "scene_title" || item.cat === "ekotoba"
    );

  // GA4: モーダルが開いた時にイベント送信
  useEffect(() => {
    const currentEkotoba = filterEkotobas[DescIndex.ekotobaId];
    gtag.event("scene_modal_open", {
      emaki_title: title,
      emaki_id: titleen,
      scene_index: DescIndex.index,
      scene_chapter: currentEkotoba?.chapter,
    });
  }, []);
  const handleChapter = (index) => {
    handleToId(index);
    closeDescModal();
  };

  const [value, setValue] = useState(0);

  const nextSlide = () => {
    setDescIndex((DescIndex) => {
      let index = DescIndex.ekotobaId + 1;
      if (index > filterEkotobas.length - 1) {
        index = 0;
      }
      return { ...DescIndex, ekotobaId: index };
    });
  };

  const prevSlide = () => {
    setDescIndex((DescIndex) => {
      let index = DescIndex.ekotobaId - 1;
      if (index < 0) {
        index = filterEkotobas.length - 1;
      }
      return { ...DescIndex, ekotobaId: index };
    });
  };

  const allMap = [
    {
      label: t("modal.description"),
      path: "description",
    },
    {
      label: t("modal.modernSentence"),
      path: "modern-sentence",
    },
  ];

  // TODO:スマホ全画面でコンテンツがつぶれるので修正する。

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeDescModal}></div>
      <div
        className={`${orientation === "landscape" ? styles.land : styles.prt} ${
          styles.container
        }`}
      >
        {/* <div className={`${styles.closebtn} btn`} onClick={closeDescModal}>
          <FontAwesomeIcon icon={faClose} />
        </div> */}
        <FontAwesomeIcon
          icon={faClose}
          className={`${styles.closebtn} btn`}
          onClick={closeDescModal}
        />
        {filterEkotobas.map((item, ekotobasIndex) => {
          const { gendaibun, text, content, chapter, linkId, desc } = item;
          const bodyText = gendaibun ?? text ?? content ?? "";
          const descText = desc ?? item.description ?? "";
          const sectionTitleDisplay =
            locale === "en"
              ? (item.title_en ?? item.title ?? "")
              : (item.title ?? item.title_en ?? "");
          const scrollIndex = item.index;

          let position = "nextSlide";

          if (ekotobasIndex === DescIndex.ekotobaId) {
            position = "activeSlide";
          }
          if (filterEkotobas.length === 1) {
            position = "activeSlide";
          } else {
            if (
              ekotobasIndex === DescIndex.ekotobaId - 1 ||
              (DescIndex.ekotobaId === 0 &&
                ekotobasIndex === filterEkotobas.length - 1)
            ) {
              position = "lastSlide";
            }
          }
          return (
            <article
              className={`${styles.article} ${styles[position]} scrollbar`}
              key={ekotobasIndex}
            >
              <h3
                className={styles.title}
                style={
                  orientation === "portrait"
                    ? {
                        fontSize: "var(--title-size-prt)",
                      }
                    : { fontSize: "var(--title-size)" }
                }
              >
                {sectionTitleDisplay ||
                  (locale == "en"
                    ? ChaptersTitle(titleen, title, chapter, "titleen")
                    : ChaptersTitle(titleen, title, chapter, "title"))}
              </h3>
              <div className={styles.tabcontainer}>
                {allMap.map((item, i) => {
                  const { label } = item;
                  return (
                    <button
                      onClick={() => setValue(i)}
                      className={`btn ${styles.tabbtn} ${
                        value === i ? styles.activebtn : ""
                      }`}
                      key={i}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className={`${styles.contents} scrollbar`}>
                {value === 0 && (
                  <p
                    className={styles.gendaibun}
                    style={
                      orientation === "portrait"
                        ? {
                            fontSize: "var(--text-size-prt)",
                          }
                        : { fontSize: "var(--text-size)" }
                    }
                  >
                    {locale == "en"
                      ? ChaptersDesc(titleen, title, chapter, "descen", descText)
                      : ChaptersDesc(titleen, title, chapter, "desc", descText)}
                  </p>
                )}
                {value === 1 && (
                  <p
                    className={styles.gendaibun}
                    style={
                      orientation === "portrait"
                        ? {
                            fontSize: "var(--text-size-prt)",
                          }
                        : { fontSize: "var(--text-size)" }
                    }
                  >
                    {bodyText
                      ? ChaptersGendaibun(titleen, title, chapter, bodyText)
                      : null}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleChapter(linkId ?? scrollIndex)}
                className={styles.linkedbutton}
              >
                {/* 横スクロールで見る */}
                {locale == "en" ? (
                  <>{t("viewer.viewImage")}: {sectionTitleDisplay || ChaptersTitle(titleen, title, chapter, "titleen")}</>
                ) : (
                  <>{sectionTitleDisplay || ChaptersTitle(titleen, title, chapter, "title")}{t("viewer.viewImage")}</>
                )}
              </button>
              <SnsShareBox
                titleen={data.titleen}
                title={data.title}
                edition={data.edition}
                chapter={chapter}
                index={DescIndex.index}
                ort={"modal"}
              />
            </article>
          );
        })}

        <button className={styles.prev} onClick={nextSlide}>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>
        <button className={styles.next} onClick={prevSlide}>
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>
    </div>
  );
};

export default ModalDesc;
