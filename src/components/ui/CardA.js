import SingleCardA from "@/components/ui/SingleCardA";
import Title from "@/components/ui/Title";
import styles from "@/styles/CardA.module.css";
import emakiStyles from "@/styles/Emakis.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const CardA = ({
  emakis,
  columns,
  sectiontitle,
  needdesc,
  sectiondesc,
  sectiontitleen,
  bcg,
  variant,
}) => {
  const { locale } = useRouter();
  const [viewMode, setViewMode] = useState("card");
  const showToggle = columns !== "searchbox";
  const isList = viewMode === "list";

  return (
    <section
      className={columns !== "searchbox" && "section-grid section-padding"}
      style={{ background: bcg }}
    >
      <div className={emakiStyles.listHeader}>
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {showToggle && (
          <div
            className={emakiStyles.viewToggle}
            role="tablist"
            aria-label={locale === "en" ? "View mode" : "表示切替"}
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "card"}
              className={`${emakiStyles.viewToggleButton} ${
                viewMode === "card" ? emakiStyles.viewToggleActive : ""
              }`}
              onClick={() => setViewMode("card")}
            >
              {locale === "en" ? "Cards" : "カード"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isList}
              className={`${emakiStyles.viewToggleButton} ${
                isList ? emakiStyles.viewToggleActive : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              {locale === "en" ? "List" : "リスト"}
            </button>
          </div>
        )}
      </div>
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <div className={isList ? emakiStyles.listView : styles[columns]}>
        {emakis.map((item, i) => {
          if (!isList) {
            return (
              <SingleCardA
                item={item}
                sectiontitle={sectiontitle}
                columns={columns}
                needdesc={needdesc}
                key={i}
                variant={variant}
                viewMode={viewMode}
              />
            );
          }

          const title = locale === "en" ? item.titleen : item.title;
          const author = locale === "en" ? item.authoren : item.author;
          const era = locale === "en" ? item.eraen || item.era : item.era;
          const typeLabel =
            locale === "en"
              ? item.typeen || item.type || "Emaki"
              : item.type || "絵巻";
          const keywords = locale === "en" ? item.keyworden : item.keyword;
          const keywordList = Array.isArray(keywords)
            ? keywords
            : keywords
              ? [keywords]
              : [];
          const viewCount = item.viewCount ?? item.views ?? item.page_views;
          const rank =
            item.rank ?? (variant === "ranking" || sectiontitleen === "ranking"
              ? i + 1
              : null);

          return (
            <Link href={`/${item.titleen}`} key={i} passHref>
              <a className={styles.listItem}>
                <div className={styles.listThumb}>
                  {item.thumb && (
                    <Image
                      src={item.thumb}
                      alt={title || ""}
                      layout="fill"
                      objectFit="cover"
                      sizes="112px"
                    />
                  )}
                </div>
                <div className={styles.listBody}>
                  <div className={styles.listRowTags}>
                    <span className={styles.badgeType}>{typeLabel}</span>
                    {era && <span className={styles.badgeEra}>{era}</span>}
                    {rank != null && (
                      <span className={styles.badgeRank}>{rank}位</span>
                    )}
                  </div>
                  <div className={styles.listRowTitle}>
                    <h3 className={styles.listTitle}>{title}</h3>
                    {author && (
                      <span className={styles.listAuthor}>{author}</span>
                    )}
                  </div>
                  <div className={styles.listRowMeta}>
                    {viewCount != null && viewCount !== "" && (
                      <span className={styles.listViewCount}>
                        👁 {Number(viewCount).toLocaleString()}
                      </span>
                    )}
                    <span className={styles.listKeywords}>
                      {keywordList.map((kw, ki) => {
                        const label =
                          typeof kw === "object" && kw != null
                            ? kw.name || kw.title || kw.slug || ""
                            : kw;
                        if (label == null || label === "") return null;
                        return (
                          <span
                            key={
                              (typeof kw === "object" &&
                                kw &&
                                (kw.id || kw.slug)) ||
                              ki
                            }
                            className={styles.keywordChip}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CardA;
