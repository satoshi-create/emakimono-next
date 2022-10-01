import React, { useState } from "react";
import Link from "next/link";
import styles from "../styles/Card.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

const Card = ({
  item: { titleen, title, thumb, edition, author, era, desc, type },
}) => {
  const [readMore, setReadmore] = useState(false);
  const filterDesc = desc.substring(0, 100);

  // const color = () => {
  //   if (era === "平安時代") {
  //     return "orange"
  //   }else{
  //     return "green"
  //   }
  // }

  const eraColor = () => {
    switch (era) {
      case "平安時代":
        return "orange"
        break;
      case "鎌倉時代":
        return "green"
        break;
      case "室町時代":
        return "purple";
        break;
      case "安土・桃山時代":
        return "gold";
        break;
      case "江戸時代":
        return "skyblue";
        break;
      case "明治時代":
        return "firebrick";
        break;
      default:
        break;
    }
  }


  return (
    <>
      <div className={styles.card}>
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
            <div className={`${eraColor()} ${styles.era}`}>{era}</div>
          </div>
        </Link>
        <div className={styles.info}>
          <div className={styles.header}>
            <h3>
              {title}
              {edition ? edition : ""}
            </h3>
            {/* <h4 className={styles.author}>{author}</h4> */}
            {/* <h4 className={styles.era}>{era}</h4> */}
          </div>
          <div className={styles.desc}>
            {/* <p>{readMore ? desc : filterDesc}</p> */}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Card;
