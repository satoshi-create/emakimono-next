import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/OverlayEkotoba.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCircleInfo,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { ChaptersTitle, ChaptersGendaibun } from "../libs/func";
import parse from "html-react-parser";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import ActionButton from "./ActionButton";
import LazyImage from "./LazyImage";

const OverlayEkotoba = ({
  item: {
    kobun,
    desc,
    gendaibun,
    srcSp,
    srcTb,
    src,
    config,
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
    googlemap,
    uniqueIndex,
  },
  item,
  isBlurVisible,
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
    handleToId,
  } = useContext(AppContext);

  const { title, titleen } = data;

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
  }, [setEkotobaImageToggle, setekotobaToggle, scroll]);

  const parseEkotobaId = (ekotobaId) => {
    if (ekotobaId) {
      return JSON.parse(ekotobaId);
    }
  };

  return (
    <div
      className={`section fade-in lazyload ${
        type === "西洋絵画" ? styles.ekotobalr : styles.ekotobarl
      } ${
        ekotobaImageToggle
          ? `${styles.gendaibunclose}`
          : `${styles.gendaibunopen}`
      } ${styles.container}`}
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
              padding: `${orientation === "portrait" ? "1rm .5rem" : ".5rem"}`,
            }}
            onClick={() => handleToId(index)}
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
              {ChaptersTitle(titleen, title, chapter)}
            </h3>

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
            {kotobagaki && (
              <ActionButton
                icon={
                  <FontAwesomeIcon
                    icon={faCircleQuestion}
                    style={{ fontSize: "1.5em" }}
                  />
                }
                label="この段の情報を見る"
                onClick={() =>
                  openDescModal({
                    ekotobaId,
                    index,
                  })
                }
                description="この段の情報を見る"
                variant="emakipageicon"
              />
            )}
          </div>
        )}
        <p
          // dangerouslySetInnerHTML={{ __html: src && ekotobabody }}
          className={styles.gendaibun}
          style={{
            fontSize: `${
              orientation === "portrait"
                ? "var(--text-size-prt)"
                : "var(--text-size)"
            }`,
          }}
        >
          {/* {ChaptersGendaibun(titleen, title, chapter, ekotobabody)} */}
          {src && ChaptersGendaibun(titleen, title, chapter, ekotobabody)}
        </p>
      </div>
      {src && (
        <div className={styles.ekotobaimagebox}>
          <LazyImage
            key={index}
            src={item}
            alt={name}
            width={srcWidth}
            height={srcHeight}
            index={index}
            srcSp={srcSp}
            config={config}
            isBlurVisible={isBlurVisible}
            uniqueIndex={uniqueIndex}
          />
        </div>
      )}
      {/* {src && (
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
      )} */}
    </div>
  );
};

export default OverlayEkotoba;
