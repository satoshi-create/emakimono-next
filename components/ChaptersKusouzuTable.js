import React from "react";
import Title from "./Title";
import AllKusouzuChapters from "../libs/kusouzu/chapters-of-kusouzu.json";
import styles from "../styles/ChaptersTable.module.css";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faXmark } from "@fortawesome/free-solid-svg-icons";

const ChaptersKusouzuTable = ({
  sectiontitle,
  sectiontitleen,
  ExistKusouzuChapters,
}) => {

  const ExistKusouzuChaptersTitletoString = ExistKusouzuChapters.map(
    (item) => item.id
  ).toString();

  console.log(ExistKusouzuChaptersTitletoString);

  const chapterKusouzuMatching = (id) =>
    ExistKusouzuChaptersTitletoString.includes(id);

  console.log(AllKusouzuChapters)

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
            <th>タイトル</th>
            <th>現代文</th>
            <th>
              <span>作品</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {AllKusouzuChapters.map((item, i) => {
            const { id, title, ruby, titleen, desc, gendaibun } = item;
             return (
              <tr key={i}>
                <td>{item.id}</td>
                <td>
                  <ruby>
                    {title} <rp>(</rp>
                    <rt>{ruby}</rt>
                    <rp>)</rp>
                  </ruby>
                </td>
                {/* <td className={styles.summary}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: desc,
                    }}
                  ></p>
                </td> */}
                <td className={styles.gendaibun}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: gendaibun,
                    }}
                  ></p>
                </td>
                <td>
                  {chapterKusouzuMatching(item.id) ? (
                    <Link href={`/kusouzu/${titleen}`}>
                      <a className={styles.link}>
                        <FontAwesomeIcon icon={faCircle} />
                      </a>
                    </Link>
                  ) : (
                    <span>
                      <FontAwesomeIcon icon={faXmark} />
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default ChaptersKusouzuTable;
