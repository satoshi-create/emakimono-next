import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/CardC.module.css";

const SingleCardC = ({ item ,i}) => {
  const { titleen, title, thumb, edition, author } = item;
  return (
    <div key={i} className={styles.box}>
      <Link href={`/${titleen}`}>
        <a target="_blank">
          <Image
            src={thumb}
            width={233}
            height={130}
            alt={title}
            className={styles.image}
          />
        </a>
      </Link>
      <Link href={`/${titleen}`}>
        <a>
          <div className={styles.metadata}>
            <h3 className={styles.title}>
              {title}
              <div>{edition}</div>
            </h3>
            <p className={styles.author}>{author}</p>
          </div>
        </a>
      </Link>
    </div>
  );
};

export default SingleCardC;