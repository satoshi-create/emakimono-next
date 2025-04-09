import ResposiveImage from "@/components/ResposiveImage";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/Ekotoba.module.css";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import { useContext, useEffect, useState } from "react";

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
    type,
    kobunsrc,
    kobunsrcSp,
    scroll,
    navIndex,
    srcWidth,
    srcHeight,
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

  // useEffect(() => {
  //   setEkotobaImageToggle(true);
  //   setekotobaToggle(true);
  // }, [setEkotobaImageToggle, setekotobaToggle]);

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
      <div
        className={`${styles.container} ${
          ekotobaImageToggle ? `${styles.close}` : `${styles.open}`
        }`}
      >
        {/* chaptercontainer */}
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
        {/* gendaibun */}
        {gendaibun && (
          <div className={styles.gendaibunBox}>
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
                  icon={ekotobaToggle ? faMinus : faPlus}
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
        {/* kobun */}
        <div
          className={
            ekotobaToggle ? `${styles.kobun} ${styles.open}` : `${styles.kobun}`
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
        // className={ekotobaImageToggle ? `${styles.open}` : `${styles.close}`}
        className={`${styles.overlaycontainer} ${
          ekotobaImageToggle ? `${styles.open}` : `${styles.close}`
        }`}
      >
        <div className={styles.gendaibunbox}>
          <p
            dangerouslySetInnerHTML={{ __html: ekotobabody }}
            className={styles.gendaibun}
          />
        </div>
        <div className={styles.ekotobaimage}>
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
      </span>
    </section>
  );
};

export default Ekotoba;
