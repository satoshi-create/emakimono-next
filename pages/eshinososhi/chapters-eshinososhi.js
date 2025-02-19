import React from 'react'
import styles from "../../styles/ChaptersTable.module.css";
import AllEshiChapters from "../../libs/emaki-text-data/eshi-no-soshi_tohaku.json";
import Title from "../../components/Title";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import parse from "html-react-parser";

const chaptersEshinososhiTable = () => {
  return (
    <section className={`section-grid section-padding `}>
      <Title
        sectiontitle={"絵師草紙諸段一覧"}
        sectiontitleen={"List of Eshi-no-soshi"}
      />
      <table className={styles.table}>
        <colgroup>
          <col span="2" className={styles.col1} />
          <col span="3" className={styles.col2} />
        </colgroup>
        <thead>
          <tr>
            <th>番号</th>
            <th>段</th>
            <th>現代文</th>
          </tr>
        </thead>
        <tbody>
          {AllEshiChapters.map((item, i) => {
            const {chapter,title,gendaibun} = item
            return (
              <tr key={i}>
                <td>{chapter}</td>
                <td className={styles.summary}>
                  <p>{parse(title)}</p>
                </td>
                <td className={styles.summary}>
                  <p>{parse(gendaibun)}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default chaptersEshinososhiTable;
