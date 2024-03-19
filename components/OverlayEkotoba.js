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
    <div
      className={`${styles.container} ${
        ekotobaImageToggle ? `${styles.open}` : `${styles.close}`
      }`}
    >
      <div className={styles.gendaibunbox}>
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
      <div className={styles.ekotobaimagebox}>
        {src && (
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
        )}
      </div>
    </div>
  );
};

export default OverlayEkotoba;
