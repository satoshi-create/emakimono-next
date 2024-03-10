import React from "react";
import Title from "./Title";
import ChapterGenji from "../libs/genji/chapters_of_genji";
import styles from "../styles/ChaptersTable.module.css";
import Link from "next/link";

const ChaptersTable = ({ sectiontitle, sectiontitleen, AllGenjiChapters }) => {
  return (
    <section className={`section-grid section-padding `}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <table className={styles.table}>
        <colgroup>
          <col span="2" className={styles.col1} />
          <col span="3" className={styles.col2} />
        </colgroup>
        <thead>
          <tr>
            <th>番号</th>
            <th>帖</th>
            {/* <th>
              <span>現代文</span>
              <span>古文</span>
            </th>
            <th>
              <span>屏風</span>
            </th> */}
            <th>
              <span>コンテンツ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {AllGenjiChapters.map((item, i) => {
            return (
              <tr key={i}>
                <th>{item.id}</th>
                <th>
                  <ruby>
                    {item.title} <rp>(</rp>
                    <rt>{item.ruby}</rt>
                    <rp>)</rp>
                  </ruby>
                </th>
                <td>
                  <Link href={`/genjie/${item.path}`} className={styles.link}>
                    <a>○</a>
                  </Link>
                </td>
                {/* <td>
                  <Link href="/genjibyobu_eawasekocyo">
                    <a className={styles.link}>○</a>
                  </Link>
                </td>
                <td>
                  <Link href="" className={styles.link}>
                    <a>✖</a>
                  </Link>
                </td> */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default ChaptersTable;
