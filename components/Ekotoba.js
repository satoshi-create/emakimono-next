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
    openModal,
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
  } = useContext(AppContext);

  const [toggle, setToggle] = useState(false);
  useEffect(() => {
    if (scroll) {
      setEkotobaImageToggle(false);
    }
  }, []);

  useEffect(() => {
    if (scroll) {
      setekotobaToggle(false);
    }
  }, []);

  return (
    <section
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      }`}
      id={`${index}`}
      style={{ background: `url(${backgroundImage})` }}
      ref={navIndex === index ? selectedRef : null}
    >
      <div
        className={ekotobaImageToggle ? `${styles.close}` : `${styles.open}`}
      >
        {/* chaptercontainer */}
        <div className={styles.chaptercontainer}>
          <h3
            dangerouslySetInnerHTML={{ __html: chapter }}
            className={styles.chapter}
          />

          {type === "浮世絵" && (
            <button
              className={styles.modalebtn}
              onClick={() => openModal(ekotobaId - 1)}
            >
              <FontAwesomeIcon
                icon={faLocationDot}
                className={styles.modalebtnicon}
              />
            </button>
          )}
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
              dangerouslySetInnerHTML={{ __html: gendaibun }}
              className={styles.gendaibuntext}
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
