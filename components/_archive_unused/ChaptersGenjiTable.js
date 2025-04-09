import AllGenjiChapters from "@/libs/genji/chapters-of-genji.json";
import styles from "@/styles/ChaptersTable.module.css";
import { faCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import Title from "../common/Title";

const ChaptersGenjiTable = ({
  sectiontitle,
  sectiontitleen,
  ExistGenjiChapters,
}) => {
  // console.log(ExistGenjiChapters.filter((item, i) => item.id === "13"));
  // const chapterGenjiMatching = (title) => {
  //   const ArrayMathing = ExistGenjiChapters.map((item, i) => {
  //     if (item.title === title) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   });
  //   return ArrayMathing;
  // };

  const ExistGenjiChaptersTitletoString = ExistGenjiChapters.map(
    (item) => item.title
  ).toString();

  const chapterGenjiMatching = (title) =>
    ExistGenjiChaptersTitletoString.includes(title);

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
            <th>あらすじ</th>
            <th>
              <span>作品</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {AllGenjiChapters.map((item, i) => {
            return (
              <tr key={i}>
                <td>{item.id}</td>
                <td>
                  <ruby>
                    {item.title} <rp>(</rp>
                    <rt>{item.ruby}</rt>
                    <rp>)</rp>
                  </ruby>
                </td>
                <td className={styles.summary}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: item.summary,
                    }}
                  ></p>
                </td>
                <td>
                  {chapterGenjiMatching(item.title) ? (
                    <Link href={`/genjie/${item.path}`}>
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

export default ChaptersGenjiTable;
