import React, { useState } from "react";
import styles from "../styles/Ekotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import ResposiveImage from "./ResposiveImage";

const Ekotoba = ({
  item: {
    chapter,
    gendaibun,
    kobun,
    index,
    backgroundImage,
    srcSp,
    srcTb,
    src,
    load,
    name,
  },
}) => {
  const [toggle, setToggle] = useState(false);
  return (
    <section
      className={styles.ekotoba}
      id={`s${index}`}
      style={{ background: `url(${backgroundImage})` }}
    >
      <div className={styles.gendaibun}>
        <h3 dangerouslySetInnerHTML={{ __html: chapter }} />
        <p dangerouslySetInnerHTML={{ __html: gendaibun }} />
        <button className={styles.togglebtn}>
          <i>
            <FontAwesomeIcon
              icon={toggle ? faMinus : faPlus}
              title={toggle ? "閉じる" : "詞書の現代語訳と原文を比べて読む"}
              onClick={() => setToggle(!toggle)}
            />
          </i>
        </button>
      </div>
      <div
        className={
          toggle ? `${styles.kobun} ${styles.open}` : `${styles.kobun}`
        }
      >
        <p dangerouslySetInnerHTML={{ __html: kobun }} />
      </div>
      <span className={styles.calligraphy}>
        <ResposiveImage value={{ srcSp, srcTb, src, load, name }} />
      </span>
    </section>
  );
};

export default Ekotoba;
