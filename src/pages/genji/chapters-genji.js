import { useMemo, useState } from "react";
import HubPageShell from "@/components/layout/HubPageShell";
import styles from "@/styles/GenjiHub.module.css";
import { buildGenjiHubData, pureImageUrl } from "@/utils/buildGenjiHubData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const SCROLL_TAG_LIMIT = 6;

const GenjiHubIntro = ({ heroThumb, heroCloudinary }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <div className={styles.hero}>
      {heroCloudinary ? (
        <div className={styles.heroImageWrap}>
          <Image
            className={styles.heroImage}
            src={`https://res.cloudinary.com/ddypua1bm/image/upload/${heroCloudinary}`}
            alt={t("genjiHub.heroAlt", {
              defaultValue: isEn ? "Tale of Genji illustrated scroll" : "源氏物語絵巻",
            })}
            layout="fill"
            sizes="100vw"
            priority
          />
        </div>
      ) : heroThumb ? (
        <div className={styles.heroImageWrap}>
          <Image
            className={styles.heroImage}
            src={heroThumb}
            alt={t("genjiHub.heroAlt", {
              defaultValue: isEn ? "Tale of Genji illustrated scroll" : "源氏物語絵巻",
            })}
            layout="fill"
            sizes="100vw"
            priority
          />
        </div>
      ) : null}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>
          {t("genjiHub.pagetitle", {
            defaultValue: isEn
              ? "The Tale of Genji — 54 chapters"
              : "源氏物語 五十四帖",
          })}
        </h1>
        <p className={styles.introLead}>
          {t("genjiHub.lead", {
            defaultValue: isEn
              ? "Explore all 54 chapters of The Tale of Genji and the illustrated scrolls that depict them."
              : "源氏物語の全五十四帖を一覧し、その帖を描いた絵巻を横断して鑑賞できます。",
          })}
        </p>
        <p className={styles.introTips}>
          {t("genjiHub.tips", {
            defaultValue: isEn
              ? "Chapters marked with a scroll badge have surviving illustrated scrolls you can view."
              : "絵巻バッジのある帖には、鑑賞できる絵巻が収録されています。",
          })}
        </p>
      </div>
    </div>
  );
};

const GenjiChapterGrid = ({ chapters }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <section className={styles.chapterSection}>
      {chapters.length === 0 ? (
        <p className={styles.chapterEmpty}>
          {t("genjiHub.noResult", {
            defaultValue: isEn
              ? "No chapters match your search."
              : "該当する帖がありません。",
          })}
        </p>
      ) : (
      <ul className={styles.chapterGrid}>
        {chapters.map((chapter) => {
          const thumbSrc =
            pureImageUrl(chapter.thumbnailUrl) || pureImageUrl(chapter.thumb);
          return (
          <li key={chapter.slug}>
            <Link href={`/genji/${chapter.slug}`}>
              <a className={styles.chapterCard}>
                {thumbSrc && (
                  <span className={styles.chapterThumbWrap}>
                    <Image
                      className={styles.chapterThumb}
                      src={thumbSrc}
                      alt={isEn ? chapter.titleen : chapter.title}
                      layout="fill"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </span>
                )}
                <span className={styles.chapterCardBody}>
                  <span
                    className={`${styles.chapterNumberBadge} ${
                      isEn ? styles.chapterNumberBadgeEn : ""
                    }`}
                  >
                    {isEn
                      ? `Chapter ${chapter.chapter_en}`
                      : `第${chapter.chapter_ch}帖`}
                  </span>
                  <h2 className={styles.chapterTitle}>
                    {isEn ? chapter.titleen : chapter.title}
                  </h2>
                  <span className={styles.chapterRuby}>{chapter.ruby}</span>
                  <span className={styles.chapterDesc}>
                    {(isEn ? chapter.descen : chapter.summary) ?? ""}
                  </span>
                  <span
                    className={
                      chapter.hasScroll
                        ? styles.chapterMeta
                        : styles.chapterMetaEmpty
                    }
                  >
                    {chapter.hasScroll
                      ? t("genjiHub.scrollAvailable", {
                          defaultValue: isEn
                            ? `${chapter.scrollTitleens.length} scroll(s)`
                            : `絵巻 ${chapter.scrollTitleens.length} 件`,
                        })
                      : t("genjiHub.scrollNone", {
                          defaultValue: isEn ? "No scroll" : "絵巻なし",
                        })}
                  </span>
                </span>
              </a>
            </Link>
          </li>
          );
        })}
      </ul>
      )}
    </section>
  );
};

const GenjiScrollCatalog = ({ scrollEmakis, chapters }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  const chapterTitleMap = {};
  chapters.forEach((chapter) => {
    chapterTitleMap[chapter.slug] = isEn ? chapter.titleen : chapter.title;
  });

  return (
    <section className={styles.scrollSection}>
      <div className={styles.scrollGrid}>
        {scrollEmakis.map((emaki) => {
          const paths = (emaki.genjieslug ?? []).map((s) => s.path);
          const titles = paths.map((p) => chapterTitleMap[p] ?? p);
          return (
            <div key={emaki.titleen} className={styles.scrollCard}>
              <Link href={`/${emaki.titleen}`}>
                <a className={styles.scrollCardInner}>
                  {pureImageUrl(emaki.thumb) && (
                    <span className={styles.scrollCardThumbWrap}>
                      <Image
                        className={styles.scrollCardThumb}
                        src={pureImageUrl(emaki.thumb)}
                        alt={isEn ? emaki.titleen : emaki.title}
                        layout="fill"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </span>
                  )}
                  <span className={styles.scrollCardBody}>
                    <h3 className={styles.scrollCardTitle}>
                      {isEn ? emaki.titleen : emaki.title}
                    </h3>
                    <span className={styles.scrollCardMeta}>
                      {emaki.era && <span>{isEn ? emaki.eraen : emaki.era}</span>}
                      <span>
                        {t("genjiHub.chapterCount", {
                          count: paths.length,
                          defaultValue: isEn
                            ? `${paths.length} chapters`
                            : `${paths.length} 帖収録`,
                        })}
                      </span>
                    </span>
                    <span className={styles.scrollCardChapters}>
                      {titles.slice(0, SCROLL_TAG_LIMIT).map((title, i) => (
                        <span
                          key={`${title}-${i}`}
                          className={styles.scrollCardChapterTag}
                        >
                          {title}
                        </span>
                      ))}
                      {titles.length > SCROLL_TAG_LIMIT && (
                        <span className={styles.scrollCardChapterMore}>
                          +{titles.length - SCROLL_TAG_LIMIT}
                        </span>
                      )}
                    </span>
                  </span>
                </a>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const ChaptersGenjilist = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  const [viewMode, setViewMode] = useState("withScroll");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("chapter");
  const [sortDir, setSortDir] = useState("asc");

  const chapterOrder = useMemo(() => {
    const map = new Map();
    hubData.chapters.forEach((chapter, index) => map.set(chapter.slug, index));
    return map;
  }, [hubData.chapters]);

  const filteredChapters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = hubData.chapters.filter((chapter) =>
      viewMode === "all" ? true : chapter.hasScroll
    );
    const searched = normalizedQuery
      ? base.filter((chapter) =>
          [
            chapter.title,
            chapter.titleen,
            chapter.ruby,
            chapter.chapter_ch,
            chapter.chapter_en,
            chapter.mainCharacter,
            chapter.summary,
            chapter.desc,
            chapter.descen,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        )
      : base;

    return [...searched].sort((a, b) => {
      let diff;
      if (sortKey === "age") {
        const ageA = parseInt(a.age, 10);
        const ageB = parseInt(b.age, 10);
        diff =
          (Number.isNaN(ageA) ? Infinity : ageA) -
          (Number.isNaN(ageB) ? Infinity : ageB);
      } else {
        diff =
          (chapterOrder.get(a.slug) ?? 0) - (chapterOrder.get(b.slug) ?? 0);
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [hubData.chapters, viewMode, query, sortKey, sortDir, chapterOrder]);

  const pageTitle = t("genjiHub.pagetitle", {
    defaultValue: isEn ? "The Tale of Genji — 54 chapters" : "源氏物語 五十四帖",
  });
  const pageDesc = t("genjiHub.metaDesc", {
    defaultValue: isEn
      ? "Browse all 54 chapters of The Tale of Genji and the illustrated scrolls that depict them."
      : "源氏物語の全五十四帖と、その帖を描いた絵巻を一覧できます。",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageTitle,
    description: pageDesc,
    numberOfItems: hubData.chapters.length,
    itemListElement: hubData.chapters.map((chapter, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: chapter.title,
      url: `/genji/${chapter.slug}`,
    })),
  };

  return (
    <HubPageShell
      meta={{
        pagetitle: pageTitle,
        pageDesc,
        jsonLd,
      }}
      breadcrumb={{ name: pageTitle }}
      hero={
        <>
          <GenjiHubIntro
            heroThumb={hubData.heroThumb}
            heroCloudinary={hubData.heroCloudinary}
          />
          <section className={styles.introSection}>
            <h2 className={styles.introTitle}>
              {isEn
                ? "The 54 Chapters and The Tale of Genji Emaki"
                : "源氏物語五十四帖と源氏物語絵巻"}
            </h2>
            <p className={styles.introText}>
              {isEn
                ? "The Tale of Genji, authored by Murasaki Shikibu in the mid-Heian period, is an epic masterpiece spanning fifty-four chapters. Portraying the glory, sorrows, and destinies of Hikaru Genji and subsequent generations, it has been visualized across centuries in numerous illustrated scrolls (Genji-e)."
                : "『源氏物語』は、平安中期に紫式部によって著された全五十四帖からなる長編文学です。光源氏の栄華と苦悩、そして次世代の運命を描くこの物語は、平安末期以降、数多くの絵巻物（源氏絵）として視覚化されてきました。"}
            </p>
            <p className={styles.introText}>
              {isEn
                ? "On this site, you can view surviving masterpieces including the National Treasure 'The Tale of Genji Emaki' (Tokugawa and Gotoh versions) in a horizontal scrolling format. Enjoy Heian court aesthetics alongside chapter synopses and excerpts."
                : "当サイトでは、現存最古の国宝『源氏物語絵巻』（徳川本・五島本等）をはじめ、各帖を題材とした絵巻作品を横スクロールで鑑賞できます。五十四帖のあらすじや詞書とともに、平安の宮廷美をお楽しみください。"}
            </p>
            <p className={styles.introNote}>
              {isEn
                ? "* Chapters with a scroll badge allow you to jump directly to the scroll viewer for depicted scenes."
                : "※「絵巻あり」バッジのある帖では、該当場面を描いた絵巻ビューアーを直接開くことができます。"}
            </p>
          </section>
        </>
      }
      navItems={[
        { id: "chapters", label: t("genjiHub.chapterSectionTitle", { defaultValue: isEn ? "54 chapters" : "五十四帖" }) },
        { id: "scrolls", label: t("genjiHub.scrollSectionTitle", { defaultValue: isEn ? "Illustrated scrolls" : "収録絵巻" }) },
      ]}
      sections={[
        {
          id: "chapters",
          content: (
            <>
              <div className={styles.chapterToolbar}>
                <div className={styles.chapterViewTabs} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "withScroll"}
                    className={`${styles.chapterViewTab} ${
                      viewMode === "withScroll"
                        ? styles.chapterViewTabActive
                        : ""
                    }`}
                    onClick={() => setViewMode("withScroll")}
                  >
                    {t("genjiHub.viewWithScroll", {
                      defaultValue: isEn ? "With scrolls" : "収録絵巻あり",
                    })}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "all"}
                    className={`${styles.chapterViewTab} ${
                      viewMode === "all" ? styles.chapterViewTabActive : ""
                    }`}
                    onClick={() => setViewMode("all")}
                  >
                    {t("genjiHub.viewAll", {
                      defaultValue: isEn ? "All 54 chapters" : "五十四帖すべて",
                    })}
                  </button>
                </div>
                <div className={styles.chapterSearchRow}>
                  <input
                    type="search"
                    className={styles.chapterSearchInput}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("genjiHub.searchPlaceholder", {
                      defaultValue: isEn
                        ? "Search by title, number, character…"
                        : "帖名・帖番号・人物・あらすじで検索",
                    })}
                    aria-label={t("genjiHub.searchPlaceholder", {
                      defaultValue: isEn ? "Search chapters" : "帖を検索",
                    })}
                  />
                  <div className={styles.chapterSortGroup}>
                    <select
                      className={styles.chapterSortSelect}
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value)}
                      aria-label={t("genjiHub.sortLabel", {
                        defaultValue: isEn ? "Sort by" : "並び替え",
                      })}
                    >
                      <option value="chapter">
                        {t("genjiHub.sortChapter", {
                          defaultValue: isEn ? "Chapter order" : "帖順",
                        })}
                      </option>
                      <option value="age">
                        {t("genjiHub.sortAge", {
                          defaultValue: isEn ? "By age (巻立)" : "巻立順",
                        })}
                      </option>
                    </select>
                    <button
                      type="button"
                      className={styles.chapterSortDirButton}
                      onClick={() =>
                        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
                      }
                    >
                      {sortDir === "asc"
                        ? t("genjiHub.sortAsc", {
                            defaultValue: isEn ? "Ascending" : "昇順",
                          })
                        : t("genjiHub.sortDesc", {
                            defaultValue: isEn ? "Descending" : "降順",
                          })}
                    </button>
                  </div>
                </div>
                <p className={styles.chapterResultCount}>
                  {isEn
                    ? `${filteredChapters.length} of ${hubData.chapters.length} chapters`
                    : `該当 ${filteredChapters.length}件 / 全${hubData.chapters.length}帖`}
                </p>
              </div>
              <GenjiChapterGrid chapters={filteredChapters} />
            </>
          ),
        },
        {
          id: "scrolls",
          content: (
            <GenjiScrollCatalog
              scrollEmakis={hubData.scrollEmakis}
              chapters={hubData.chapters}
            />
          ),
        },
      ]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildGenjiHubData(),
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default ChaptersGenjilist;
