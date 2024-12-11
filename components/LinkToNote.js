import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/LinkToNote.module.css";
import noteData from "../libs/note/data.json";

const LinkToNote = ({ title,reletedEmakisToNote }) => {

  // const reletedEmakisToNote = noteData.filter((item) =>
  //   item.relatedEmakis.includes(title)
  // );

  return (
    <div className={styles.container}>
      {reletedEmakisToNote.map((item, i) => {
        return (
          <Link key={i} href={item.noteUrl}>
            <a target="_blank" rel="noopener noreferrer" className={styles.box}>
              {/* CORSエラーのため画像をnoteからfetchできない */}
              <Image
                src={`/${item.eyecatch}.webp`}
                alt={item.name}
                width={1280}
                height={670}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
              {/* <h4 className={styles.title}>{item.name}</h4>
              <small>{item.publishAt}</small> */}

              {/* <p className={styles.subtitle}>～{item.subtitle}～</p> */}
            </a>
          </Link>
        );
      })}
    </div>
  );
};

export default LinkToNote;
