import SingleCardA from "@/components/ui/SingleCardA";
import Title from "@/components/ui/Title";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";
import styles from "@/styles/CardA.module.css";
import emakiStyles from "@/styles/Emakis.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

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
  const isEn = locale === "en";
  const [viewMode, setViewMode] = useState("card");
  const [selectedHubSlug, setSelectedHubSlug] = useState("all");
  const showToggle = columns !== "searchbox";
  const isList = viewMode === "list";

  const hubFilterOptions = useMemo(() => {
    if (!showToggle || !Array.isArray(emakis) || emakis.length < 4) return [];
    return getAllHubPages()
      .map((hub) => {
        const matched = filterEmakisForHub(emakis, hub);
        return { hub, count: matched.length, matchedIds: new Set(matched.map((m) => m.titleen || m.id)) };
      })
      .filter((entry) => entry.count > 0 && entry.count < emakis.length);
  }, [emakis, showToggle]);

  const displayedEmakis = useMemo(() => {
    if (selectedHubSlug === "all") return emakis;
    const target = hubFilterOptions.find((opt) => opt.hub.slug === selectedHubSlug);
    if (!target) return emakis;
    return emakis.filter((it) => target.matchedIds.has(it.titleen || it.id));
  }, [emakis, selectedHubSlug, hubFilterOptions]);

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
            aria-label={isEn ? "View mode" : "表示切替"}
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
              {isEn ? "Cards" : "カード"}
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
              {isEn ? "List" : "リスト"}
            </button>
          </div>
        )}
      </div>

      {hubFilterOptions.length > 0 && (
        <div
          role="group"
          aria-label={isEn ? "Filter by Polaroid Board theme" : "ボード貼り付け候補テーマで絞り込み"}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            margin: "0 auto 20px",
            padding: "10px 14px",
            borderRadius: 12,
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#92400e",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginRight: 4,
            }}
          >
            <span aria-hidden="true">📷</span>
            <span>{isEn ? "Board Pin Candidates:" : "ボード貼り付け候補:"}</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedHubSlug("all")}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 999,
              border: selectedHubSlug === "all" ? "1.5px solid #92400e" : "1px solid #fcd34d",
              background: selectedHubSlug === "all" ? "#92400e" : "#ffffff",
              color: selectedHubSlug === "all" ? "#ffffff" : "#78350f",
              cursor: "pointer",
            }}
          >
            {isEn ? `All (${emakis.length})` : `すべて (${emakis.length})`}
          </button>
          {hubFilterOptions.map(({ hub, count }) => {
            const active = selectedHubSlug === hub.slug;
            return (
              <button
                key={hub.slug}
                type="button"
                onClick={() => setSelectedHubSlug(active ? "all" : hub.slug)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: active ? "1.5px solid #047857" : "1px solid #6ee7b7",
                  background: active ? "#047857" : "#ecfdf5",
                  color: active ? "#ffffff" : "#065f46",
                  cursor: "pointer",
                }}
              >
                {isEn ? `${hub.titleEn || hub.titleJa} (${count})` : `${hub.titleJa || hub.titleEn} (${count})`}
              </button>
            );
          })}
        </div>
      )}

      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <div className={isList ? emakiStyles.listView : styles[columns]}>
        {displayedEmakis.map((item, i) => {
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
            <Link href={`/${item.titleen}`} key={i} passHref prefetch={false}>
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
