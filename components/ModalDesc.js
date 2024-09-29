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
  conectKusouzuChaptersGendaibun,
  conectKusouzuChaptersTitle,
  conectKusouzuChaptersStageCh,
  conectKusouzuChaptersDesc
} from "../libs/func";
import SnsShareBox from "./SnsShareBox";
import Link from "next/link";

const ModalDesc = ({ data }) => {
  const { DescIndex, setDescIndex, handleToId, closeDescModal, orientation } =
    useContext(AppContext);
  const emakis = data.emakis;
  const { genjieslug,title } = data;

  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  const handleChapter = (index) => {
    handleToId(index);
    closeDescModal();
  };





  const [value, setValue] = useState(0);

  // const nextSlide = () => {
  //   setMapIndex((oldIndex) => {
  //     let index = oldIndex + 1;
  //     if (index > filterEkotobas.length - 1) {
  //       index = 0;
  //     }
  //     return index;
  //   });
  // };
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
      title: "あらすじ",
      titleen: "summary",
      path: "summary",
    },
    {
      title: "現代文",
      titleen: "modern-sentence",
      path: "modern-sentence",
    },
    {
      title: "古文",
      titleen: "ancient-text",
      path: "ancient-text",
    },
    {
      title: "解説",
      titleen: "description",
      path: "description",
    },
  ];

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeDescModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeDescModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
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
          if (value === 0) {
            return (
              <article
                className={`${styles.article} ${styles[position]} scrollbar`}
                key={ekotobasIndex}
              >
                <div className={styles.titlebox}>
                  <h4
                    className={styles.link}
                    style={
                      orientation === "portrait"
                        ? {
                            fontSize: "var(--title-size-prt)",
                          }
                        : { fontSize: "var(--title-size)" }
                    }
                    onClick={() => handleChapter(linkId)}
                  >
                    {conectKusouzuChaptersStageCh(chapter)
                      ? `【第${conectKusouzuChaptersStageCh(
                          chapter
                        )}相】 ${conectKusouzuChaptersTitle(chapter)}`
                      : chapter}
                  </h4>
                  {genjieslug && (
                    <div className={`${styles.genjieslugBox}`}>
                      <Link href={`/genjie/chapters-genji`}>
                        <a className={styles.genjieslugTitle} target="_blank">
                          源氏物語54帖一覧
                        </a>
                      </Link>
                    </div>
                  )}
                  {title.includes("九相") && (
                    <div className={`${styles.genjieslugBox}`}>
                      <Link href={`/kusouzu/chapters-kusouzu`}>
                        <a className={styles.genjieslugTitle}>九相図一覧</a>
                      </Link>
                    </div>
                  )}
                </div>
                <h4>現代文</h4>
                <p
                  className={styles.gendaibun}
                  style={
                    orientation === "portrait"
                      ? {
                          fontSize: "var(--text-size-prt)",
                        }
                      : { fontSize: "var(--text-size)" }
                  }
                  dangerouslySetInnerHTML={{
                    __html: conectKusouzuChaptersGendaibun(chapter)
                      ? conectKusouzuChaptersGendaibun(chapter)
                      : gendaibun,
                  }}
                ></p>
                <h4>解説</h4>
                <p
                  className={styles.gendaibun}
                  style={
                    orientation === "portrait"
                      ? {
                          fontSize: "var(--text-size-prt)",
                        }
                      : { fontSize: "var(--text-size)" }
                  }
                  dangerouslySetInnerHTML={{
                    __html: conectKusouzuChaptersDesc(chapter)
                      ? conectKusouzuChaptersDesc(chapter)
                      : gendaibun,
                  }}
                ></p>

                <button
                  type="button"
                  onClick={() => handleChapter(linkId)}
                  className={styles.linkedbutton}
                >
                  横スクロールで見る
                </button>
                <SnsShareBox
                  titleen={data.titleen}
                  title={data.title}
                  edition={data.edition}
                  chapter={chapter}
                  index={DescIndex.index}
                  ort={"modal"}
                />
                {/* 他絵巻へのリンク */}
                {/* <div className={styles.emakiLinks}>
                  <p>壇林皇后九相図 - 血塗相</p>
                  <p>九相詩絵巻 - 血塗相</p>
                </div> */}
              </article>
            );
          }
          if (value === 1) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                {gendaibun && gendaibun}
              </article>
            );
          }
          if (value === 2) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                {kobun && kobun}
              </article>
            );
          }
          if (value === 3) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                {desc && desc}
              </article>
            );
          }
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
