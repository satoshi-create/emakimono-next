import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/ModalDesc.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  ChaptersTitle,
  ChaptersGendaibun,
  ChaptersDesc,
} from "../libs/func";
import SnsShareBox from "./SnsShareBox";
import Link from "next/link";

const ModalDesc = ({ data }) => {
  const { DescIndex, setDescIndex, handleToId, closeDescModal, orientation } =
    useContext(AppContext);
  const emakis = data.emakis;
  const { genjieslug, title, titleen } = data;

  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
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
      title: "現代文",
      titleen: "modern-sentence",
      path: "modern-sentence",
    },
    // {
    //   title: "古文",
    //   titleen: "ancient-text",
    //   path: "ancient-text",
    // },
    {
      title: "解説",
      titleen: "description",
      path: "description",
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
          const { gendaibun, chapter, linkId, desc, kobun } = item;

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
                onClick={() => handleChapter(linkId)}
              >
                {ChaptersTitle(titleen,title, chapter)}
              </h3>
              <div className={styles.tabcontainer}>
                {allMap.map((item, i) => {
                  const { title } = item;
                  return (
                    <button
                      onClick={() => setValue(i)}
                      className={`btn ${styles.tabbtn} ${
                        value === i ? styles.activebtn : ""
                      }`}
                      key={i}
                    >
                      {title}
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
                    {ChaptersGendaibun(titleen, title, chapter, gendaibun)}
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
                    {ChaptersDesc(titleen, title, chapter, desc)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleChapter(linkId)}
                className={styles.linkedbutton}
              >
                横スクロールで見る
              </button>
              {/* <SnsShareBox
                titleen={data.titleen}
                title={data.title}
                edition={data.edition}
                chapter={chapter}
                index={DescIndex.index}
                ort={"modal"}
              /> */}
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
