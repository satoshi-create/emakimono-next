import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/OverlayEkotoba.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot,faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { matchSummary } from "../libs/func";

const OverlayEkotoba = ({
  item: {
    kobun,
    desc,
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
    chapter_num,
    index,
    navIndex,
    type,
    ekotobaId,
    kotobagaki,
    cat,
    data,
    googlemap
  },
}) => {
  const {
    setekotobaToggle,
    ekotobaImageToggle,
    setEkotobaImageToggle,
    scrollDialog,
    orientation,
    ekotobaToggle,
    openMapModal,
    openDescModal,
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
    if (!scroll) {  
      setEkotobaImageToggle(true);
    } else {
      setEkotobaImageToggle(false);
    }
    setekotobaToggle(false);
  }, [setEkotobaImageToggle, setekotobaToggle]);

  const parseEkotobaId = (ekotobaId) => {
    if (ekotobaId) {
      return JSON.parse(ekotobaId);
    }
  };
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
        {chapter && (
          <div
            className={styles.chapterbox}
            style={{
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
              dangerouslySetInnerHTML={{
                __html: chapter,
              }}
            ></h3>
            {type === "浮世絵" && googlemap && (
              <button
                className={styles.mapiconlink}
                onClick={() => openMapModal(ekotobaId)}
                title={`${chapter}の場所を地図で確認する`}
              >
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className={styles.mapiconlinkicon}
                />
              </button>
            )}
            {kotobagaki  && (
              <button
                className={`${styles.infoiconlink} ekotoba_info_click`}
                // data-link-click="ekotoba_info_click"
                onClick={() =>
                  openDescModal({
                    ekotobaId,
                    // parseEkotobaId: parseEkotobaId(ekotobaId),
                    index,
                  })
                }
                title={`${chapter}の情報を見る`}
              >
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className={styles.infoiconlinkicon}
                />
              </button>
            )}
            
          </div>
        )}
        <p
          dangerouslySetInnerHTML={{ __html: src && ekotobabody }}
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
