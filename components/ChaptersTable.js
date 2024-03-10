import React from "react";
import Title from "./Title";
import ChapterGenji from "../libs/genji/chapters_of_genji";
import styles from "../styles/ChaptersTable.module.css";
import Link from "next/link";

const ChaptersTable = ({ sectiontitle, sectiontitleen, AllGenjiChapters }) => {
  // console.log(AllGenjiChapters.filter((item, i) => item.id === "13"));
  // const chapterGenjiMatching = (title) => {
  //   const ArrayMathing = AllGenjiChapters.map((item, i) => {
  //     if (item.title === title) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   });
  //   return ArrayMathing;
  // };

  const AllGenjiChaptersTitletoString = AllGenjiChapters.map(
    (item) => item.title
  ).toString();
  const chapterGenjiMatching = (title) =>
    AllGenjiChaptersTitletoString.includes(title);

  console.log(chapterGenjiMatching());

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
              <span>作品</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ChapterGenji.map((item, i) => {
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
                  {chapterGenjiMatching(item.title) ? (
                    <Link href={`/genjie/${item.path}`} className={styles.link}>
                      <a>○</a>
                    </Link>
                  ) : (
                    <span>✖</span>
                  )}
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
