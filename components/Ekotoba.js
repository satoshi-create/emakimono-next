import React, { useContext, useEffect, useState } from "react";
import styles from "../styles/Ekotoba.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";

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
  const {
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
      className={`section ${styles.ekotoba}`}
      id={`s${index}`}
      style={{ background: `url(${backgroundImage})` }}
    >
      <div
        className={ekotobaImageToggle ? `${styles.close}` : `${styles.open}`}
      >
        <div className={styles.gendaibun}>
          <h3 dangerouslySetInnerHTML={{ __html: chapter }} />
          <p dangerouslySetInnerHTML={{ __html: gendaibun }} />
          <button
            className={styles.togglebtn}
            onClick={() => setToggle(!toggle)}
          >
            <i>
              <FontAwesomeIcon
                icon={toggle ? faMinus : faPlus}
                title={
                  toggle ? "閉じる" : "詞書の現代語訳と原文を比べて読む"
                }
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
