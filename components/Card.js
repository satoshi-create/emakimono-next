import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import eraColor from "../libs/func";

const Card = ({
  item: { titleen, title, thumb, edition, author, era, eraen, desc, typeen },
}) => {
  const [readMore, setReadmore] = useState(false);
  const filterDesc = desc.substring(0, 100);
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const tag = ["html", "css", "javascript", "jquery"];

  return (
    <>
      <div className={styles.card}>
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
        <div className={styles.info}>
          <div className={styles.header}>
            <h3>{title}</h3>
            {/* <h3
              dangerouslySetInnerHTML={{
                __html: `${title}`,
              }}
            /> */}
            {/* <h4 className={styles.author}>{author}</h4> */}
          </div>
          <div className={styles.desc}>
            {desc ? (
              <>
                <p
                  dangerouslySetInnerHTML={{
                    __html: `${readMore ? desc : filterDesc}`,
                  }}
                />
                <button
                  onClick={() => setReadmore(!readMore)}
                  className={styles.readMore}
                >
                  {readMore ? "閉じる" : "...続きを読む"}
                </button>
              </>
            ) : (
              <p
                dangerouslySetInnerHTML={{
                  __html: descTemp,
                }}
              />
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <Link href={`/era/${eraen}`}>
            <a>
              <div className={`${styles[eraColor(era)]} ${styles.era}`}>
                {era}
              </div>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Card;
