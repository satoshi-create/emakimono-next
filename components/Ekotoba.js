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
import Title from "./Title";

const Ekotoba = ({
  item: {
    chapter,
    chapterruby,
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
    id,
  },
}) => {
  const {
    openModal,
    ekotobaToggle,
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
  } = useContext(AppContext);

  const [toggle, setToggle] = useState(false);
  useEffect(() => {
    setEkotobaImageToggle(false);
  }, []);

  useEffect(() => {
    setekotobaToggle(false);
    false;
  }, []);
  return (
    <section
      className={`section ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      }`}
      id={`s${index}`}
      style={{ background: `url(${backgroundImage})` }}
    >
      <div
        className={ekotobaImageToggle ? `${styles.close}` : `${styles.open}`}
      >
        <div className={styles.gendaibun}>
          <h3>
            <ruby>
              <rb>{chapter}</rb>
              <rp>（</rp>
              <rt>{chapterruby}</rt>
              <rp>）</rp>
            </ruby>
          </h3>
          <p dangerouslySetInnerHTML={{ __html: gendaibun }} />
          {kotobagaki === true && (
            <>
              <button
                className={styles.modalebtn}
                onClick={() => openModal(id - 1)}
              >
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className={styles.modalebtnicon}
                />
              </button>
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
            </>
          )}
        </div>
        <div
          className={
            toggle ? `${styles.kobun} ${styles.open}` : `${styles.kobun}`
          }
        >
          <p dangerouslySetInnerHTML={{ __html: kobun }} />
        </div>
      </div>
      <span
        className={ekotobaImageToggle ? `${styles.open}` : `${styles.close}`}
      >
        {src && <ResposiveImage value={{ srcSp, srcTb, src, load, name }} />}
      </span>
    </section>
  );
};

export default Ekotoba;
