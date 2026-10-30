import LazyImage from "@/components/emaki/viewer/LazyImage";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/OverlayEkotoba.module.css";
import { ChaptersTitle } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext } from "react";

const OverlayEkotoba = ({
  item: {
    src,
    config,
    name,
    srcWidth,
    srcHeight,
    chapter,
    genji_chapter: genjiChapter,
    index,
    navIndex,
    data,
    uniqueIndex,
  },
  item,
  // 屏風（typeen === "byobu"）: 縦長黒帯（段タイトルバー）の見た目のみ非表示にする。
  // 幅0マーカーのラッパー要素・DOM 構造・navIndex/scrollDialog ref は一切変更しない。
  hideChapterTitle = false,
}) => {
  const { scrollDialog, orientation, handleToId, chapterToggle } =
    useContext(AppContext);
  const { locale } = useRouter();
  const { title, titleen } = data;

  // 正式な章名 → スライス個別タイトル → シーン番号の順で解決
  const chapterTitle =
    (locale === "en"
      ? ChaptersTitle(titleen, title, chapter, "titleen", genjiChapter)
      : ChaptersTitle(titleen, title, chapter, "title", genjiChapter)) ||
    item?.title ||
    (chapter != null && chapter !== ""
      ? locale === "en"
        ? `Scene ${chapter}`
        : `第${chapter}段`
      : typeof index === "number"
      ? locale === "en"
        ? `Scene ${index + 1}`
        : `第${index + 1}場面`
      : "");

  return (
    <div
      className={`section ${styles.ekotobarl} ${styles.container}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      {chapterTitle && chapterToggle && !hideChapterTitle && (
        <div
          className={`${styles.chapterbox} ${
            orientation === "portrait"
              ? styles.chapterboxPrt
              : styles.chapterboxLand
          } ${locale === "en" ? styles.chapterboxEn : ""}`}
        >
          <h3
            className={`${styles.chapter} ${
              orientation === "portrait" ? styles.chapterPrt : styles.chapterLand
            } ${locale === "en" ? styles.chapterEn : ""}`}
            onClick={() => handleToId(index)}
            style={{
              fontFamily:
                locale === "en"
                  ? "var(--font-ui)"
                  : "var(--font-classical)",
            }}
          >
            {chapterTitle}
          </h3>
          <div
            className={`${styles.chapterActions} ${
              locale === "en" ? styles.chapterActionsEn : ""
            }`}
          >
            <SceneLikeButton emakiId={titleen} sceneIndex={index} variant="overlay"/>
          </div>
        </div>
      )}
      {src && (
        <div className={styles.ekotobaimagebox}>
          <LazyImage
            key={index}
            src={item}
            alt={name}
            width={srcWidth}
            height={srcHeight}
            config={config}
            uniqueIndex={uniqueIndex}
          />
        </div>
      )}
    </div>
  );
};

export default OverlayEkotoba;
