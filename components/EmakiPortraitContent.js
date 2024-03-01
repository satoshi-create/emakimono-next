import React, { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiPortraitContent.module.css";
import { AppContext } from "../pages/_app";

const EmakiPortraitContent = ({ data }) => {
  const { handleToId } = useContext(AppContext);
  const { locale } = useRouter();
  const { type, typeen, eraen, era, title, edition, author, desc, emakis } =
    data;

  const filterDesc = desc.substring(0, 40);
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  return (
    <div className={styles.container}>
      <div className={styles.metadataA}>
        <div className={styles.cat}>
          <Link href={`/category/${typeen}`}>
            <a className={styles.type}>{locale === "en" ? typeen : type}</a>
          </Link>
          <Link href={`/era/${eraen}`}>
            <a className={`era ${styles.era}`}>
              {locale === "en" ? `${eraen} period` : `${era}時代`}
            </a>
          </Link>
        </div>
        <h3 className={styles.title}>
          {title}　{edition}
        </h3>
        <h4 className={styles.author}>
          {author
            ? author
            : `${locale == "en" ? "artist unknown" : "絵師不詳"}`}
        </h4>
      </div>

      <div className={styles.desc}>
        {desc ? `${filterDesc}...もっと見る` : descTemp}
      </div>

      <ul className={styles.mokuji}>
        {emakis.map((item, index) => {
          const { cat, chapter } = item;
          if (cat === "ekotoba") {
            return (
              <li key={index}>
                <span
                  onClick={() => handleToId(index)}
                  dangerouslySetInnerHTML={{ __html: chapter }}
                ></span>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
};

export default EmakiPortraitContent;
