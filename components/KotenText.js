import React, { useContext, useEffect, useState } from "react";
import styles from "../styles/KotenText.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faCaretLeft,
  faCaretRight,
} from "@fortawesome/free-solid-svg-icons";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const Kotentext = ({
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
      {ekotobaImageToggle ? (
        // 古文側
        <div
          className={`${styles.container} ${
            ekotobaImageToggle
              ? `${styles.kobun} ${styles.open}`
              : `${styles.kobun}`
          }`}
        >
          {/* chapter */}
          {chapter && (
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
            </div>
          )}
          {/* kobun */}
          <div
            className={`${styles.kobunBox} ${styles.kobunSideKobun}`}
            style={{
              fontSize: `${
                orientation === "portrait"
                  ? "var(--title-size-prt)"
                  : "var(--title-size)"
              }`,
            }}
          >
            <p
              dangerouslySetInnerHTML={{ __html: kobun }}
              className={styles.kobuntext}
            />
            {gendaibun && (
              <button
                className={styles.togglekobun}
                onClick={() => setekotobaToggle(!ekotobaToggle)}
              >
                <FontAwesomeIcon
                  icon={!ekotobaToggle && faCaretLeft}
                  title={
                    ekotobaToggle
                      ? "閉じる"
                      : "詞書の現代語訳と原文を比べて読む"
                  }
                  className={styles.togglebtnicon}
                />
              </button>
            )}
          </div>
          {/* toggle - gendaibun */}
          {ekotobaToggle && (
            <div
              className={`${styles.gendaibunBox} ${styles.kobunSideGendaibun}`}
            >
              <p
                dangerouslySetInnerHTML={{ __html: gendaibun }}
                className={styles.gendaibuntext}
                style={{
                  fontSize: `${
                    orientation === "portrait"
                      ? "var(--text-size-prt)"
                      : "var(--text-size)"
                  }`,
                }}
              />
              <button
                className={`${styles.togglekobun} ${styles.togglekobunClose}`}
                onClick={() => setekotobaToggle(!ekotobaToggle)}
              >
                <FontAwesomeIcon
                  icon={ekotobaToggle && faCaretRight}
                  title={
                    ekotobaToggle
                      ? "閉じる"
                      : "詞書の現代語訳と原文を比べて読む"
                  }
                  className={styles.togglebtnicon}
                />
              </button>
            </div>
          )}
        </div>
      ) : (
        // 現代文側
        <div className={styles.container}>
          {/* chapter */}
          {chapter && (
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
            </div>
          )}
          {/* gendaibun */}
          {gendaibun && (
            <div
              className={`${styles.gendaibunBox} ${styles.gendaibunSideGendaibun}`}
            >
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
              {kobun && (
                <button
                  className={styles.togglekobun}
                  onClick={() => setekotobaToggle(!ekotobaToggle)}
                >
                  <FontAwesomeIcon
                    icon={!ekotobaToggle && faCaretLeft}
                    title={
                      ekotobaToggle
                        ? "閉じる"
                        : "詞書の現代語訳と原文を比べて読む"
                    }
                    className={styles.togglebtnicon}
                  />
                </button>
              )}
            </div>
          )}
          {/* toggle - kobun */}
          {ekotobaToggle && (
            <>
              <div
                className={`${styles.kobunBox} ${styles.gendaibunSideKobun}`}
              >
                <p
                  dangerouslySetInnerHTML={{ __html: kobun }}
                  className={styles.kobuntext}
                  style={{
                    fontSize: `${
                      orientation === "portrait"
                        ? "var(--text-size-prt)"
                        : "var(--text-size)"
                    }`,
                  }}
                />
                <button
                  className={`${styles.togglekobun} ${styles.togglekobunClose}`}
                  onClick={() => setekotobaToggle(!ekotobaToggle)}
                >
                  <FontAwesomeIcon
                    icon={ekotobaToggle && faCaretRight}
                    title={
                      ekotobaToggle
                        ? "閉じる"
                        : "詞書の現代語訳と原文を比べて読む"
                    }
                    className={styles.togglebtnicon}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Kotentext;
