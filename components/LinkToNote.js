import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from "../styles/LinkToNote.module.css"

const LinkToNote = ({note}) => {
  return (
    <div className={styles.container}>
      {note.map((item, i) => {
        return (
          <Link key={i} href={item.url} >
            <a target='_blank' className={styles.box}>
              <Image src={item.src} width={1280} height={670} />
              <h4 className={styles.title}>{item.title}</h4>
              <p className={styles.subtitle}>～{item.subtitle}～</p>
            </a>
          </Link>
        );
      })}
</div>
  )
}

export default LinkToNote