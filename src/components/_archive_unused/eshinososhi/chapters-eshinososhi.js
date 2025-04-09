import AllEshiChapters from "@/libs/emaki-text-data/eshi-no-soshi_tohaku.json";
import styles from "@/styles/ChaptersTable.module.css";
import parse from "html-react-parser";
import Title from "../../common/Title";

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
            const { chapter, title, gendaibun } = item;
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
};

export default chaptersEshinososhiTable;
