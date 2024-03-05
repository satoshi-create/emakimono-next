import React, { useContext, useEffect, useState } from "react";
import styles from "../styles/Ekotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const Ekotoba = ({
  item: {
    chapter,
    gendaibun,
    kobun,
    index,
    srcSp,
    srcTb,
    src,
    load,
    name,
    backgroundImage,
    kotobagaki,
    type,
    ekotobaId,
    kobunsrc,
    kobunsrcSp,
    scroll,
    selectedRef,
    navIndex,
  },
}) => {
  const {
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
  } = useContext(AppContext);

  const [toggle, setToggle] = useState(false);

  // dangerouslySetInnerHTMLでgendaibunを描画使用するとHydration failedになる問題の対処のため、
  // gendaibunを最初のレンダリング後に取得
  // https://qiita.com/maaaashi/items/957bf8a949833151612b
  const [ekotobabody, setEkotobabody] = useState("");
  console.log(ekotobabody);
  useEffect(() => {
    setEkotobabody(gendaibun);
  }, [setEkotobabody, gendaibun]);

  useEffect(() => {
    if (scroll) {
      setEkotobaImageToggle(false);
    }
  }, [setEkotobaImageToggle, scroll]);

  useEffect(() => {
    if (scroll) {
      setekotobaToggle(false);
    }
  }, [setekotobaToggle, scroll]);

  return (
    <section
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      }`}
      id={`${index}`}
      style={{ background: `url(${backgroundImage})` }}
      // ref={navIndex === index ? selectedRef : null}
      ref={navIndex === index ? scrollDialog : null}
    >
      <div
        // className={ekotobaImageToggle ? `${styles.close}` : `${styles.open}`}
        className={`${styles.container} ${
          ekotobaImageToggle ? `${styles.close}` : `${styles.open}`
        }`}
      >
        {/* chaptercontainer */}
        <div className={styles.chaptercontainer}>
          <h3
            dangerouslySetInnerHTML={{ __html: chapter }}
            className={styles.chapter}
            style={{
              fontSize: `${
                orientation === "portrait"
                  ? "var(--title-size-prt)"
                  : "var(--title-size)"
              }`,
            }}
          />

          {/* {type === "浮世絵" && (
            <button
              className={styles.modalebtn}
              onClick={() => openModal(ekotobaId - 1)}
            >
              <FontAwesomeIcon
                icon={faLocationDot}
                className={styles.modalebtnicon}
              />
            </button>
          )} */}
          {kobun && (
            <button
              className={styles.togglebtn}
              onClick={() => setToggle(!toggle)}
            >
              <FontAwesomeIcon
                icon={toggle ? faMinus : faPlus}
                title={toggle ? "閉じる" : "詞書の現代語訳と原文を比べて読む"}
                className={styles.togglebtnicon}
              />
            </button>
          )}
        </div>
        {/* gendaibun */}
        {gendaibun && (
          <div className={styles.gendaibun}>
            <p
              dangerouslySetInnerHTML={{ __html: ekotobabody }}
              className={styles.gendaibuntext}
              style={{
                fontSize: `${
                  orientation === "portrait"
                    ? "var(--text-size-prt)"
                    : "var(--text-size)"
                }`,
              }}
            />
          </div>
        )}
        {/* kobun */}
        <div
          className={
            toggle ? `${styles.kobun} ${styles.open}` : `${styles.kobun}`
          }
        >
          <p
            dangerouslySetInnerHTML={{ __html: kobun }}
            className={styles.kobuntext}
          />
          {kobunsrc && (
            <ResposiveImage
              value={{ src: kobunsrc, srcSp: kobunsrcSp, scroll }}
            />
          )}
        </div>
      </div>
      {/* ekotobaimage */}
      <span
        className={ekotobaImageToggle ? `${styles.open}` : `${styles.close}`}
      >
        {src && (
          <ResposiveImage value={{ srcSp, srcTb, src, load, name, scroll }} />
        )}
      </span>
    </section>
  );
};

export default Ekotoba;
