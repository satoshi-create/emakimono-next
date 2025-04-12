import Title from "@/components/ui/Title";
import AllKusouzuChapters from "@/data/emaki-text-data/chapters-of-kusouzu.json";
import styles from "@/styles/ChaptersTable.module.css";
import { faCircle, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const ChaptersKusouzuTable = ({
  sectiontitle,
  sectiontitleen,
  KusouzuArrObj,
}) => {
  // const ExistKusouzuChaptersTitletoString = (contentTitle) =>
  //   KusouzuArrObj.filter((item) => item.title === contentTitle)
  //     .flatMap((item) => item.kusouzuslug)
  //     .map((item) => item.id)
  //     .toString();

  const ExistKusouzuChaptersTitletoString = (contentTitle) =>
    KusouzuArrObj.filter((item) => item.title === contentTitle)
      .flatMap((item) => item.emakis)
      .map((item) => item.chapter)
      .join(" ");

  // const ExistKusouzuChaptersTitletoString = ExistKusouzuChapters.map(
  //   (item) => item.id
  // ).toString();

  const chapterKusouzuMatching = (contentTitle, contentid) =>
    ExistKusouzuChaptersTitletoString(contentTitle).includes(contentid);

  // const chapterKusouzuMatching = (id) =>
  //   ExistKusouzuChaptersTitletoString.includes(id);

  return (
    <section className={`section-grid section-padding `}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <table className={styles.table}>
        <colgroup>
          {/* <col span="2" className={styles.col1} />
          <col span="3" className={styles.col2} /> */}
        </colgroup>
        <thead className={styles.thead}>
          <tr>
            <th>相</th>
            <th>タイトル</th>
            <th>解説</th>
            <th>現代文</th>
            {KusouzuArrObj.map((item, i) => {
              return (
                <th key={i} className={styles.contents}>
                  {item.title}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {AllKusouzuChapters.map((item, i) => {
            const {
              stage_en,
              stage_ch,
              title,
              ruby,
              titleen,
              desc,
              gendaibun,
            } = item;
            return (
              <tr key={i}>
                <td className={styles.chapter}>第{stage_ch}相</td>
                <td>
                  <ruby>
                    {title} <rp>(</rp>
                    <rt>{ruby}</rt>
                    <rp>)</rp>
                  </ruby>
                </td>
                <td className={styles.summary}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: desc,
                    }}
                  ></p>
                </td>
                <td className={styles.gendaibun}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: gendaibun,
                    }}
                  ></p>
                </td>
                {KusouzuArrObj.map((item, i) => {
                  return (
                    <td key={i}>
                      {chapterKusouzuMatching(item.title, stage_en) ? (
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
                  );
                })}
                {/* <td>
                  {chapterKusouzuMatching("九相図巻", stage_en) ? (
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
                </td> */}
                {/* <td>
                  {chapterKusouzuMatching("九相図", stage_en) ? (
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
                <td>
                  {chapterKusouzuMatching("九相詩絵巻", stage_en) ? (
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
                <td>
                  {chapterKusouzuMatching("檀林皇后九相観", stage_en) ? (
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
                </td> */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default ChaptersKusouzuTable;
