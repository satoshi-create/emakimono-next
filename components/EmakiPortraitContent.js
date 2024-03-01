import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiPortraitContent.module.css";
import { AppContext } from "../pages/_app";
import { eraColor } from "../libs/func";

const EmakiPortraitContent = ({ data }) => {
  const { handleToId } = useContext(AppContext);
  const { locale } = useRouter();
  const {
    type,
    typeen,
    eraen,
    era,
    title,
    edition,
    author,
    desc,
    emakis,
    sourceImage,
    sourceImageUrl,
    subtype,
    reference,
  } = data;

  const filterDesc = desc.substring(0, 40);
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  return (
    <div className={styles.container}>
      <div className={styles.metadataA}>
        <h3 className={styles.title}>
          {title}　{edition}
        </h3>
        <h4 className={styles.author}>
          {author
            ? author
            : `${locale == "en" ? "artist unknown" : "絵師不詳"}`}
        </h4>
      </div>
      <div className={styles.metadataB}>
        <div
          className={styles.desc}
          dangerouslySetInnerHTML={{ __html: desc ? desc : descTemp }}
        ></div>
        <ul
          className={styles.chapter}
          // style={{ color: eraColor(era) }}
        >
          {emakis.map((item, index) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li key={index}>
                  <span
                    onClick={() => handleToId(index)}
                    dangerouslySetInnerHTML={{ __html: chapter }}
                    className={styles[eraColor(era)]}
                  ></span>
                </li>
              );
            }
          })}
        </ul>
        <div className={styles.cat}>
          <Link href={`/era/${eraen}`}>
            <a
              className={styles.era}
              style={{
                border: eraColor(era),
                backgroundColor: eraColor(era),
              }}
            >
              {locale === "en" ? `${eraen} period` : `${era}`}
            </a>
          </Link>
          <Link href={`/category/${typeen}`} className={styles.type}>
            <a>{locale === "en" ? typeen : type}</a>
          </Link>
        </div>
        <div className={styles.authority}>
          <Link href={sourceImageUrl}>
            <a target="_blank" className={styles.sourceLink}>
              出典 - {sourceImage}
            </a>
          </Link>
          <div> {reference ? `参照 - ${reference}` : ""}</div>
        </div>
      </div>
    </div>
  );
};

export default EmakiPortraitContent;
