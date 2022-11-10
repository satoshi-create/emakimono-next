import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import eraColor from "../libs/func";

const Card = ({
  item: {
    titleen,
    title,
    thumb,
    edition,
    author,
    era,
    eraen,
    desc,
    typeen,
    type,
  },
  columns,
  needdesc,
}) => {
  // const [readMore, setReadmore] = useState(false);
  const filterDesc = desc.substring(0, 40);
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  return (
    <>
      <div className={`${styles.card} ${styles[columns]} `}>
        <Link href={`/${titleen}`}>
          <a>
            <div className={styles.single}>
              <img src={thumb} loading="lazy" alt={title} />
              {/* <picture>
              <source data-srcset={thumb} type="image/webp" />
              <img
                src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                className="lazyload loading"
                alt={thumb}
              />
            </picture> */}
            </div>
          </a>
        </Link>
        <div className={styles.footer}>
          <h3 className={styles.title}>
            {title}　{edition}
          </h3>
          <h4 className={styles.author}>{author ? author : "絵師不明"}</h4>
          {needdesc && (
            <div className={styles.desc}>
              {desc ? `${filterDesc}...` : descTemp}
            </div>
          )}
          <div className={styles.link}>
            <Link href={`/${titleen}`}>
              <a className={styles.link}>横スクロールで見る</a>
            </Link>
          </div>
        </div>
        <div className={styles.info}>
          <Link href={`/category/${typeen}`}>
            <a>{type}</a>
          </Link>
          <Link href={`/era/${eraen}`}>
            <a>{era}</a>
          </Link>
          <div>3巻</div>
        </div>
      </div>
    </>
  );
};

export default Card;
