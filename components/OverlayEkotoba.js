import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/OverlayEkotoba.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";

const OverlayEkotoba = ({
  item: {
    gendaibun,
    srcSp,
    srcTb,
    src,
    load,
    name,
    scroll,
    srcWidth,
    srcHeight,
    chapter,
    index,
    navIndex,
    type,
  },
}) => {
  const {
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
    ekotobaToggle,
  } = useContext(AppContext);

  // dangerouslySetInnerHTMLでgendaibunを描画使用するとHydration failedになる問題の対処のため、
  // gendaibunを最初のレンダリング後に取得
  // https://qiita.com/maaaashi/items/957bf8a949833151612b
  const [ekotobabody, setEkotobabody] = useState("");

  useEffect(() => {
    setEkotobabody(gendaibun);
  }, [setEkotobabody, gendaibun]);

  useEffect(() => {
    setEkotobaImageToggle(true);
    setekotobaToggle(true);
  }, [setEkotobaImageToggle, setekotobaToggle]);

  return (
    <section
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      } ${
        ekotobaImageToggle
          ? `${styles.gendaibunclose}`
          : `${styles.gendaibunopen}`
      } ${styles.container}`}
      id={`${index}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      <div
        className={`${styles.gendaibunbox} ${!src && styles.noekotobaimage}`}
      >
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
        <p
          dangerouslySetInnerHTML={{ __html: ekotobabody }}
          className={styles.gendaibun}
          style={{
            fontSize: `${
              orientation === "portrait"
                ? "var(--text-size-prt)"
                : "var(--text-size)"
            }`,
          }}
        />
      </div>
      {src && (
        <div className={styles.ekotobaimagebox}>
          <ResposiveImage
            value={{
              srcSp,
              srcTb,
              src,
              load,
              name,
              scroll,
              srcWidth,
              srcHeight,
            }}
          />
        </div>
      )}
    </section>
  );
};

export default OverlayEkotoba;
