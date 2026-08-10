import styles from "@/styles/EmakiTimeline.module.css";
import EmakiTimelineChip from "@/components/chronology/EmakiTimelineChip";
import { eraColor } from "@/utils/func";

/** サイトの時代区分順（era/[slug] の slug と一致）。年表に該当する時代のみ表示 */
const ERA_ORDER = [
  { era: "平安", eraen: "heiann" },
  { era: "鎌倉", eraen: "kamakura" },
  { era: "室町", eraen: "muromachi" },
  { era: "安土・桃山", eraen: "aduchimomoyama" },
  { era: "江戸", eraen: "edo" },
  { era: "明治", eraen: "meiji" },
];

const TimelineRow = ({ row, head, liveSlugs, comingSoon }) => {
  const hasArts = Boolean(row.arts);
  const hasEmaki = Array.isArray(row.emaki) && row.emaki.length > 0;
  return (
    <tr>
      <td data-label={head.year} className={styles.yearCell}>
        <span className={styles.year}>{row.yearText || row.year}</span>
      </td>
      <td data-label={head.emperor}>{row.emperor || "—"}</td>
      <td data-label={head.eraName}>{row.eraName || "—"}</td>
      <td data-label={head.politics}>{row.politics || "—"}</td>
      <td data-label={head.arts}>
        {hasArts && <p className={styles.artsText}>{row.arts}</p>}
        {hasEmaki && (
          <ul className={styles.emakiList}>
            {row.emaki.map((link, i) => (
              <li key={i}>
                <EmakiTimelineChip
                  link={link}
                  liveSlugs={liveSlugs}
                  comingSoon={comingSoon}
                />
              </li>
            ))}
          </ul>
        )}
      </td>
      <td data-label={head.regent}>{row.regent || "—"}</td>
      <td data-label={head.culture}>{row.culture || "—"}</td>
    </tr>
  );
};

const EmakiTimeline = ({ rows, liveSlugs, t }) => {
  const head = t("timeline.tableHead", { returnObjects: true });
  const comingSoon = t("timeline.comingSoon");

  const sections = ERA_ORDER.map((era) => ({
    ...era,
    rows: rows.filter((row) => row.eraen === era.eraen),
  })).filter((section) => section.rows.length > 0);

  return (
    <>
      <nav className={styles.toc} aria-label={t("timeline.eraJump")}>
        <h3>{t("timeline.eraJump")}</h3>
        <ul className={styles.tocList}>
          {sections.map((section) => (
            <li key={section.eraen}>
              <a href={`#${section.eraen}`} className={styles.tocLink}>
                <span
                  className={styles.dot}
                  style={{ background: eraColor(section.era) }}
                />
                {section.era}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section) => (
        <section
          key={section.eraen}
          id={section.eraen}
          className={styles.eraSection}
        >
          <h2
            className={styles.eraHeader}
            style={{ borderColor: eraColor(section.era) }}
          >
            <span
              className={styles.eraBadge}
              style={{ background: eraColor(section.era) }}
            >
              {section.era}
            </span>
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{head.year}</th>
                  <th scope="col">{head.emperor}</th>
                  <th scope="col">{head.eraName}</th>
                  <th scope="col">{head.politics}</th>
                  <th scope="col">{head.arts}</th>
                  <th scope="col">{head.regent}</th>
                  <th scope="col">{head.culture}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <TimelineRow
                    key={`${section.eraen}-${i}`}
                    row={row}
                    head={head}
                    liveSlugs={liveSlugs}
                    comingSoon={comingSoon}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
};

export default EmakiTimeline;
