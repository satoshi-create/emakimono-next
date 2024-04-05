import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/OverlayEkotoba.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

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

  // TODO : 目次のフォントサイズをレスポンシブにする

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
        className={`${styles.gendaibunbox} ${
          !src && styles.noekotobaimage
        } scrollbar`}
      >
        <div
          className={styles.chapterbox}
          style={{
            display: `${type === "浮世絵" && "flex"}`,
            alignItems: `${type === "浮世絵" && "center"}`,
            padding: `${
              orientation === "portrait" ? "1rem .5rem" : "1.5rem 1rem"
            }`,
          }}
        >
          <h3
            className={styles.chapter}
            style={{
              fontSize: `${
                orientation === "portrait"
                  ? "var(--title-size-prt)"
                  : "var(--title-size)"
              }`,
            }}
          >
            {chapter}
          </h3>
          {type === "浮世絵" && (
            <Link href="/">
              <a className={styles.mapiconlink}>
                <i>
                  <FontAwesomeIcon icon={faLocationDot} />
                </i>
              </a>
            </Link>
          )}
        </div>
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
