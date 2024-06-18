import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from "../styles/LinkToNote.module.css"
import noteData from "../libs/note/data.json"

const LinkToNote = ({title}) => {
  console.log(title)

  // const sentence = "直幹申文絵詞扇面法華経冊子長谷雄草紙";

  // const word = "長谷雄草紙（摸本）"

  // console.log(word.includes(sentence));

  const reletedEmakisToNote = noteData.filter((item) =>
    item.relatedEmakis.includes(title)
  );
console.log(reletedEmakisToNote);
  return (
    <div className={styles.container}>
      {reletedEmakisToNote.map((item, i) => {
        return (
          <Link key={i} href={item.noteUrl}>
            <a target="_blank" className={styles.box}>
              {/* CORSエラーのため画像をnoteからfetchできない */}
              {/* <Image src={item.eyecatch} alt={item.name } width={1280} height={960}/> */}
              <h4 className={styles.title}>{item.name}</h4>
              <small>{item.publishAt}</small>

              {/* <p className={styles.subtitle}>～{item.subtitle}～</p> */}
            </a>
          </Link>
        );
      })}
    </div>
  );
}

export default LinkToNote