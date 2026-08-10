import EmakiTimelineChip from "@/components/chronology/EmakiTimelineChip";
import styles from "@/styles/EmakiTimelineSimple.module.css";
import { eraColor } from "@/utils/func";
import Link from "next/link";

/**
 * 簡易年表（さくっと見る）。
 * 時代ごとのまとめ文と「歴史 → 絵巻」の因果エントリを、縦フローで追える形にする。
 */
const EmakiTimelineSimple = ({ rows, liveSlugs, t }) => {
  const comingSoon = t("timeline.comingSoon");

  return (
    <div className={styles.container}>
      {rows.length > 1 && (
        <nav className={styles.toc} aria-label={t("timeline.eraJump")}>
          <h3>{t("timeline.eraJump")}</h3>
          <ul className={styles.tocList}>
            {rows.map((era) => (
              <li key={era.eraen}>
                <a href={`#simple-${era.eraen}`} className={styles.tocLink}>
                  <span
                    className={styles.dot}
                    style={{ background: eraColor(era.era) }}
                  />
                  {era.era}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {rows.map((era, i) => {
        const nextEra = rows[i + 1];
        const color = eraColor(era.era);
        return (
          <section key={era.eraen} id={`simple-${era.eraen}`} className={styles.eraCard}>
            <header className={styles.eraHeader}>
              <span className={styles.eraBadge} style={{ background: color }}>
                {era.era}
              </span>
              <span className={styles.eraPeriod}>{era.period}</span>
            </header>
            <p className={styles.eraCatch}>{era.catch}</p>
            {Array.isArray(era.keywords) && era.keywords.length > 0 && (
              <ul className={styles.keywordList}>
                {era.keywords.map((kw, k) => (
                  <li key={k} className={styles.keyword}>
                    {kw}
                  </li>
                ))}
              </ul>
            )}
            <ol className={styles.timeline}>
              {era.entries.map((entry, j) => (
                <li key={j} className={styles.entry}>
                  <span className={styles.entryLine} style={{ background: color }} />
                  <span className={styles.entryDot} style={{ background: color }} />
                  <div className={styles.entryBody}>
                    <div className={styles.entryTitle}>
                      <span className={styles.entryYear}>{entry.year}</span>
                      <h3 className={styles.entryEvent}>{entry.event}</h3>
                    </div>
                    <p className={styles.entryStory}>{entry.story}</p>
                    {Array.isArray(entry.emaki) && entry.emaki.length > 0 && (
                      <ul className={styles.emakiList}>
                        {entry.emaki.map((link, k) => (
                          <li key={k}>
                            <EmakiTimelineChip
                              link={link}
                              liveSlugs={liveSlugs}
                              comingSoon={comingSoon}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {nextEra && (
              <Link href={`#simple-${nextEra.eraen}`}>
                <a className={styles.nextEra}>
                  {t("timeline.nextEra", { era: nextEra.era })}
                  <span aria-hidden>→</span>
                </a>
              </Link>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default EmakiTimelineSimple;
