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
}) => {
  const [readMore, setReadmore] = useState(false);
  const filterDesc = desc.substring(0, 100);
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
            <br />
            {author ? author : "絵師不明"}
          </h3>
          {/* <div className={styles.info}>
            <div className={styles.type}>
              <div>{type}</div>
              <div>type</div>
            </div>
            <div className={styles.scroll}>
              <div>3</div>
              <div>scroll</div>
            </div>
            <div className={styles.era}>
              <div>{era}</div>
              <div>era</div>
            </div>
          </div> */}
          <div className={styles.link}>
            <Link href={`/${titleen}`}>
              <a className={styles.link}>横スクロールで見る</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Card;
