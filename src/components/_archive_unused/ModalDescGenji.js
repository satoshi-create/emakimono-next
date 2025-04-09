import {
  ChaptersTitle,
  connectGenjiChapters,
  connectGenjiChaptersScene,
} from "@/libs/utils/func";
import styles from "@/styles/ModalDesc.module.css";
import {
  faAnglesLeft,
  faAnglesRight,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useContext, useState } from "react";
import { AppContext } from "../../pages/_app";
import SnsShareBox from "../common/SnsShareBox";

const ModalDescGenji = ({ data }) => {
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

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeDescModal}></div>
      <div
        className={`${orientation === "landscape" ? styles.land : styles.prt} ${
          styles.container
        }`}
      >
        <FontAwesomeIcon
          icon={faClose}
          className={`${styles.closebtn} btn`}
          onClick={closeDescModal}
        />
        {filterEkotobas.map((item, ekotobasIndex) => {
          const { gendaibun, chapter, linkId, desc, kobun, scene } = item;

          const allMap = [
            {
              title: "場面内容",
              titleen: "scene",
              path: "scene",
            },
            {
              title: `${connectGenjiChapters(chapter, "title")}のあらすじ`,
              titleen: "modern-sentence",
              path: "modern-sentence",
            },
          ];

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
                {ChaptersTitle(titleen, title, chapter)}
              </h3>
              {genjieslug && (
                <aside className={`${styles.linktochapter}`}>
                  <Link href={`/genjie/chapters-genji`}>
                    <a className={styles.genjieslugTitle}>源氏物語54帖一覧</a>
                  </Link>
                </aside>
              )}
              {title.includes("九相") && (
                <aside className={`${styles.linktochapter}`}>
                  <Link href={`/kusouzu/chapters-kusouzu`}>
                    <a className={styles.genjieslugTitle}>九相図一覧</a>
                  </Link>
                </aside>
              )}
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
                {/* {toggleContents(value, chapter, gendaibun, desc)} */}
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
                    dangerouslySetInnerHTML={{
                      __html: connectGenjiChaptersScene(chapter, scene)
                        ? connectGenjiChaptersScene(chapter, scene)
                        : desc,
                    }}
                  ></p>
                )}
                {value === 1 && (
                  <>
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
                        __html: connectGenjiChapters(chapter, "chapter_en")
                          ? `${connectGenjiChapters(
                              chapter,
                              "main-character"
                            )}${connectGenjiChapters(chapter, "age")}`
                          : gendaibun,
                      }}
                    ></p>
                    <br />
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
                        __html: connectGenjiChapters(chapter, "chapter_en")
                          ? connectGenjiChapters(chapter, "summary")
                          : gendaibun,
                      }}
                    ></p>
                  </>
                )}
              </div>

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
            </article>
          );
          // if (value === 1) {
          //   return (
          //     <article
          //       className={`${styles.article} ${styles[position]}`}
          //       key={ekotobasIndex}
          //     >
          //       {gendaibun && gendaibun}
          //     </article>
          //   );
          // }
          // if (value === 2) {
          //   return (
          //     <article
          //       className={`${styles.article} ${styles[position]}`}
          //       key={ekotobasIndex}
          //     >
          //       {kobun && kobun}
          //     </article>
          //   );
          // }
          // if (value === 3) {
          //   return (
          //     <article
          //       className={`${styles.article} ${styles[position]}`}
          //       key={ekotobasIndex}
          //     >
          //       {desc && desc}
          //     </article>
          //   );
          // }
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

export default ModalDescGenji;
