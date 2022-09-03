import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";

const Card = ({ emakis }) => {
  const [readMore, setReadmore] = useState(false);
  console.log(emakis);

  return (
    <section className={`section-center ${styles.conteiner}`}>
      {emakis.map((item, index) => {
        const {
          titleen,
          title,
          thumb,
          edition,
          author,
          era,
          desc,
          type,
          typeColor,
        } = item;
        const filterDesc = desc.substring(0, 100);
        return (
          <div className={styles.card} key={index}>
            <Link href={`/emakis/${titleen}`}>
              <div className={styles.single}>
                <picture>
                  <source data-srcset={thumb} type="image/webp" />
                  <img
                    src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                    className="lazyload loading"
                    alt={thumb}
                  />
                </picture>
                <div className={`${typeColor} ${styles.type}`}>{type}</div>
              </div>
            </Link>
            <div className={styles.info}>
              <div className={styles.header}>
                <h3>
                  {title}
                  {edition ? edition : ""}
                </h3>
                <h4 className={styles.author}>{author}</h4>
                <h4 className={styles.era}>{era}</h4>
              </div>
              <div className={styles.desc}>
                {/* <p>{readMore ? desc : filterDesc}</p> */}
                <p
                  dangerouslySetInnerHTML={{
                    __html: `${readMore ? desc : filterDesc}`,
                  }}
                />
                <button onClick={() => setReadmore(!readMore)} className={styles.readMore}>
                  {readMore ? "閉じる" : "...続きを読む"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default Card;
