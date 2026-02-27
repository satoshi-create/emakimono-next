import ResposiveImage from "@/components/emaki/viewer/ResposiveImage";
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
    gendaibun: gendaibunProp,
    text,
    content,
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
    width,
    height,
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

  // 新スキーマ: item.text / item.content、旧スキーマ: item.gendaibun
  const gendaibun = gendaibunProp ?? text ?? content ?? "";

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
                srcWidth: srcWidth ?? width,
                srcHeight: srcHeight ?? height,
              }}
            />
          )}
        </div>
      </span>
    </section>
  );
};

export default Ekotoba;
