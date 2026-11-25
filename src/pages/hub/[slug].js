import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HubMinimalTemplate from "@/components/hub/HubMinimalTemplate";
import { filterBoardsForHubSlug } from "@/libs/hubPublicBoards";
import emakisData from "@/data/scroll-metadata";
import { useLocaleMeta } from "@/hooks/useLocale";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import {
  filterEmakisForHub,
  getAllHubPages,
  getHubBySlug,
} from "@/libs/hubPages";
import { fetchCollabBoard, fetchPublicBoards } from "@/libs/api/ugcApi";
import { removeNestedEmakisObj } from "@/utils/emakiList";
import { buildGenjiHubData } from "@/utils/buildGenjiHubData";
import GenjiChaptersSection from "@/components/genji/GenjiChaptersSection";
import { buildChojuGigaHubData } from "@/utils/buildChojuGigaHubData";
import { buildChojuGigaHubJsonLd } from "@/utils/buildChojuGigaHubJsonLd";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import { buildKusouzuHubData } from "@/utils/buildKusouzuHubData";
import { buildKusouzuHubJsonLd } from "@/utils/buildKusouzuHubJsonLd";
import KusouzuHubIntro from "@/components/emaki/kusouzu/KusouzuHubIntro";
import KusouzuHubPeople from "@/components/emaki/kusouzu/KusouzuHubPeople";
import KusouzuStageGrid from "@/components/emaki/kusouzu/KusouzuStageGrid";
import { buildHyakkiHubData } from "@/utils/buildHyakkiHubData";
import { buildRakuchuRakugaiHubData } from "@/utils/buildRakuchuRakugaiHubData";
import {
  RakuchuCompositionSection,
  RakuchuMotifSection,
} from "@/components/rakuchu-rakugai/RakuchuMotifExplorer";
import RakuchuSightseeingMapSection from "@/components/rakuchu-rakugai/RakuchuSightseeingMapSection";
import { FORM_TAB_IDS } from "@/components/rakuchu-rakugai/rakuchuScrollConstants";
import Title from "@/components/ui/Title";
import { useTranslation } from "next-i18next";
import styles from "@/styles/ByobuHub.module.css";
import choujuStyles from "@/styles/ChoujuGigaHub.module.css";
import kusouzuStyles from "@/styles/KusouzuHub.module.css";

const choujuHeroLoader = createCloudinaryHeroLoader("g_auto");

function buildDynamicHubJsonLd({ locale, defaultLocale, meta, hub, items }) {
  const isEn = locale === "en";
  const pageTitle = isEn ? hub.titleEn || hub.titleJa : hub.titleJa;
  const pageDesc = isEn
    ? hub.descriptionEn || hub.descriptionJa
    : hub.descriptionJa;
  const pageUrl = buildLocaleUrl(locale, hub.path, defaultLocale);

  const itemListElement = items
    .filter((item) => item.titleen)
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: isEn ? item.titleen : item.title || item.titleen,
      url: buildLocaleUrl(locale, `/${item.titleen}`, defaultLocale),
    }));

  const graph = [
    {
      "@type": "CollectionPage",
      "@id": pageUrl,
      name: pageTitle,
      description: pageDesc,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: meta.siteTitle, url: SITE_ORIGIN },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: meta.siteTitle,
          item: buildLocaleUrl(locale, "/", defaultLocale),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: isEn ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          item: buildLocaleUrl(locale, "/hub", defaultLocale),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: pageTitle,
          item: pageUrl,
        },
      ],
    },
  ];

  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    " "
  );
}

export default function DynamicHubPage({
  hub,
  items,
  genjiChapters,
  builtinHubData,
}) {
  const { t } = useTranslation("common");
  const { locale, defaultLocale, query } = useRouter();
  const { t: meta } = useLocaleMeta();
  const isEn = locale === "en";
  const [linkedBoard, setLinkedBoard] = useState(null);
  const [relatedBoards, setRelatedBoards] = useState([]);

  useEffect(() => {
    if (!hub?.linkedBoardId) return;
    let active = true;
    fetchCollabBoard(hub.linkedBoardId)
      .then((res) => {
        if (!active || !res?.board) return;
        setLinkedBoard(res.board);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hub?.linkedBoardId]);

  useEffect(() => {
    if (!hub?.slug) return;
    let active = true;
    fetchPublicBoards()
      .then((res) => {
        if (!active) return;
        const boards = Array.isArray(res?.boards) ? res.boards : [];
        setRelatedBoards(filterBoardsForHubSlug(boards, hub.slug));
      })
      .catch(() => {
        if (active) setRelatedBoards([]);
      });
    return () => {
      active = false;
    };
  }, [hub?.slug]);

  const hubBoardLinks = useMemo(() => {
    const byId = new Map();
    relatedBoards.forEach((board) => {
      if (board?.id) byId.set(board.id, board);
    });
    if (hub?.linkedBoardId) {
      const existing = byId.get(hub.linkedBoardId);
      byId.set(hub.linkedBoardId, {
        ...(existing || {}),
        id: hub.linkedBoardId,
        title: existing?.title || linkedBoard?.title,
      });
    }
    return Array.from(byId.values());
  }, [relatedBoards, hub?.linkedBoardId, linkedBoard?.title]);

  if (!hub) return null;

  const title = isEn ? hub.titleEn || hub.titleJa : hub.titleJa;
  const description = isEn
    ? hub.descriptionEn || hub.descriptionJa
    : hub.descriptionJa;

  const jsonLd = buildDynamicHubJsonLd({
    locale,
    defaultLocale,
    meta,
    hub,
    items,
  });

  const heroItem = items.find((item) => item.thumb);

  const linkedPolaroidItems =
    linkedBoard && Array.isArray(linkedBoard.items) ? linkedBoard.items : [];
  const polaroidsContent =
    linkedPolaroidItems.length > 0 ? (
        <section
          style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
              {isEn
                ? `Featured Polaroids (${linkedPolaroidItems.length})`
                : `このテーマの切り抜きポラロイド（${linkedPolaroidItems.length}枚）`}
            </h2>
            <Link
              href={`/board?room=${encodeURIComponent(hub.linkedBoardId)}`}
              locale={locale}
              passHref
            >
              <a style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>
                {isEn ? "Open Board →" : "ボードで全件見る・追加する →"}
              </a>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {linkedPolaroidItems.slice(0, 8).map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(20, 20, 20, 0.1)",
                  borderRadius: 10,
                  padding: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {p.src && (
                  <img
                    src={p.src}
                    alt={p.displayChapter || p.displayTitle || ""}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 6,
                      display: "block",
                    }}
                  />
                )}
                {p.displayChapter && (
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                    {p.displayChapter}
                  </div>
                )}
                {p.displayTitle && (
                  <div
                    style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}
                  >
                    {isEn ? p.displayTitle : `『${p.displayTitle}』`}
                  </div>
                )}
                {(p.message || p.memo) && (
                  <p
                    style={{
                      fontSize: 12,
                      margin: "6px 0 0",
                      lineHeight: 1.45,
                    }}
                  >
                    {p.message || p.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
    ) : null;

  const extraSections = [];
  if (polaroidsContent) {
    extraSections.push({ id: "polaroids", content: polaroidsContent });
  }
  if (hub.slug === "genji-world" && Array.isArray(genjiChapters)) {
    extraSections.push({
      id: "chapters",
      content: <GenjiChaptersSection chapters={genjiChapters} />,
    });
  }

  if (hub.slug === "chouju-giga" && builtinHubData) {
    const builtinJsonLd = buildChojuGigaHubJsonLd({
      locale,
      defaultLocale,
      pageName: t("choujuGigaHub.pagetitle"),
      pageDescription: t("choujuGigaHub.metaDesc"),
      siteTitle: meta.siteTitle,
      hubData: builtinHubData,
    });
    return (
      <HubMinimalTemplate
        meta={{
          pagetitle: t("choujuGigaHub.pagetitle"),
          pageDesc: t("choujuGigaHub.metaDesc"),
          jsonLd: builtinJsonLd,
        }}
        breadcrumb={{
          name: t("choujuGigaHub.breadcrumb"),
          test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          testen: "hub",
        }}
        heroProps={{
          title: t("choujuGigaHub.introTitle"),
          description: t("choujuGigaHub.intro"),
          locale,
          boards: hubBoardLinks,
          boardProps: { ariaLabel: t("choujuGigaHub.linkedPublicBoardsAria") },
          styles: choujuStyles,
          media:
            builtinHubData.heroCloudinary || builtinHubData.heroThumb ? (
              <div className={choujuStyles.heroImageWrap}>
                {builtinHubData.heroCloudinary ? (
                  <Image
                    loader={choujuHeroLoader}
                    src={builtinHubData.heroCloudinary}
                    alt={t("choujuGigaHub.introTitle")}
                    width={1600}
                    height={900}
                    sizes="100vw"
                    priority
                    className={choujuStyles.heroImage}
                  />
                ) : (
                  <Image
                    src={builtinHubData.heroThumb}
                    alt={t("choujuGigaHub.introTitle")}
                    width={800}
                    height={450}
                    sizes="100vw"
                    priority
                    className={choujuStyles.heroImage}
                  />
                )}
              </div>
            ) : null,
        }}
        worksSection={{
          id: "scrolls",
          emakis: builtinHubData.scrolls,
          sectiontitle: t("choujuGigaHub.scrollSectionTitle"),
        }}
        extraSections={extraSections.length > 0 ? extraSections : undefined}
      />
    );
  }

  if (hub.slug === "kusouzu" && builtinHubData) {
    const builtinJsonLd = buildKusouzuHubJsonLd({
      locale,
      defaultLocale,
      pageName: t("kusouzuHub.pagetitle"),
      pageDescription: t("kusouzuHub.metaDesc"),
      siteTitle: meta.siteTitle,
      hubData: builtinHubData,
    });
    return (
      <HubMinimalTemplate
        meta={{
          pagetitle: t("kusouzuHub.pagetitle"),
          pageDesc: t("kusouzuHub.metaDesc"),
          jsonLd: builtinJsonLd,
        }}
        breadcrumb={{
          name: t("kusouzuHub.breadcrumb"),
          test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          testen: "hub",
        }}
        heroProps={{
          title: t("kusouzuHub.introTitle"),
          description: t("kusouzuHub.intro"),
          locale,
          boards: hubBoardLinks,
          boardProps: { ariaLabel: t("kusouzuHub.linkedPublicBoardsAria") },
          styles: kusouzuStyles,
          media: (
            <KusouzuHubIntro
              heroThumb={builtinHubData.heroThumb}
              heroCloudinary={builtinHubData.heroCloudinary}
            />
          ),
        }}
        worksSection={{
          id: "scrolls",
          emakis: builtinHubData.scrollEmakis,
          sectiontitle: t("kusouzuHub.scrollSectionTitle"),
        }}
        navItems={[
          { id: "stages", label: t("kusouzuHub.stageSectionTitle") },
          { id: "scrolls", label: t("kusouzuHub.scrollSectionTitle") },
          { id: "people", label: t("kusouzuHub.peopleSectionTitle") },
        ]}
        extraSections={[
          { id: "stages", content: <KusouzuStageGrid stages={builtinHubData.stages} /> },
          { id: "people", content: <KusouzuHubPeople /> },
          ...extraSections,
        ]}
      />
    );
  }

  if (hub.slug === "hyakki" && builtinHubData) {
    const pageUrl = buildLocaleUrl(locale, hub.path, defaultLocale);
    const pageTitle = t("hyakkiHub.pagetitle");
    const pageDesc = t("hyakkiHub.metaDesc");
    const hubDirectoryName =
      locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧";
    const itemListElement = (builtinHubData.scrolls || [])
      .filter((s) => s.titleen)
      .map((s, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: locale === "en" ? s.titleen : s.title || s.titleen,
        url: buildLocaleUrl(locale, `/${s.titleen}`, defaultLocale),
      }));
    const builtinJsonLd = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": pageUrl,
            name: pageTitle,
            description: pageDesc,
            url: pageUrl,
            isPartOf: {
              "@type": "WebSite",
              name: meta.siteTitle,
              url: SITE_ORIGIN,
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: itemListElement.length,
              itemListElement,
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: meta.siteTitle,
                item: buildLocaleUrl(locale, "/", defaultLocale),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: hubDirectoryName,
                item: buildLocaleUrl(locale, "/hub", defaultLocale),
              },
              {
                "@type": "ListItem",
                position: 3,
                name: pageTitle,
                item: pageUrl,
              },
            ],
          },
        ],
      },
      null,
      " "
    );
    return (
      <HubMinimalTemplate
        meta={{
          pagetitle: t("hyakkiHub.pagetitle"),
          pageDesc: t("hyakkiHub.metaDesc"),
          jsonLd: builtinJsonLd,
        }}
        breadcrumb={{
          name: t("hyakkiHub.breadcrumb"),
          test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          testen: "hub",
        }}
        heroProps={{
          title: t("hyakkiHub.introTitle"),
          description: t("hyakkiHub.intro"),
          locale,
          boards: hubBoardLinks,
          boardProps: {
            ariaLabel: t("hyakkiHub.linkedPublicBoardsAria"),
            untitledLabel: t("hyakkiHub.linkedPublicBoardUntitled"),
            itemCountLabel: (count) =>
              t("hyakkiHub.linkedPublicBoardItemCount", { count }),
          },
          styles: choujuStyles,
          media: builtinHubData.heroThumb ? (
            <div className={choujuStyles.heroImageWrap}>
              <Image
                src={builtinHubData.heroThumb}
                alt={t("hyakkiHub.introTitle")}
                width={800}
                height={450}
                sizes="100vw"
                priority
                className={choujuStyles.heroImage}
              />
            </div>
          ) : null,
        }}
        worksSection={{
          id: "scrolls",
          emakis: builtinHubData.scrolls,
          sectiontitle: t("hyakkiHub.scrollSectionTitle"),
        }}
        extraSections={extraSections.length > 0 ? extraSections : undefined}
      />
    );
  }

  if (hub.slug === "rakuchu-rakugai" && builtinHubData) {
    const pageUrl = buildLocaleUrl(locale, hub.path, defaultLocale);
    const pageTitle = t("rakuchuRakugaiHub.pagetitle");
    const pageDesc = t("rakuchuRakugaiHub.metaDesc");
    const hubDirectoryName =
      locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧";
    const itemListElement = (builtinHubData.scrolls || [])
      .filter((s) => s.titleen)
      .map((s, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: locale === "en" ? s.titleen : s.title || s.titleen,
        url: buildLocaleUrl(locale, `/${s.titleen}`, defaultLocale),
      }));
    const builtinJsonLd = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            "@id": pageUrl,
            name: pageTitle,
            description: pageDesc,
            url: pageUrl,
            isPartOf: {
              "@type": "WebSite",
              name: meta.siteTitle,
              url: SITE_ORIGIN,
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: itemListElement.length,
              itemListElement,
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: meta.siteTitle,
                item: buildLocaleUrl(locale, "/", defaultLocale),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: hubDirectoryName,
                item: buildLocaleUrl(locale, "/hub", defaultLocale),
              },
              {
                "@type": "ListItem",
                position: 3,
                name: pageTitle,
                item: pageUrl,
              },
            ],
          },
        ],
      },
      null,
      " "
    );
    const formFromQuery =
      typeof query?.form === "string" && FORM_TAB_IDS.includes(query.form)
        ? query.form
        : undefined;
    const motifFromQuery =
      typeof query?.motif === "string" ? query.motif : undefined;
    const compositionSection = (
      <section
        className={`section-padding ${choujuStyles.scrollSection}`}
        style={{
          width: "100%",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
          scrollMarginTop: "96px",
        }}
      >
        <div
          style={{
            maxWidth: "min(96vw, 1560px)",
            margin: "0 auto",
            paddingLeft: "clamp(12px, 2vw, 24px)",
            paddingRight: "clamp(12px, 2vw, 24px)",
            boxSizing: "border-box",
          }}
        >
          <Title
            sectiontitle={
              locale === "en" ? "Composition Lineages" : "構図形式の比較"
            }
          />
          <p
            className={choujuStyles.introLead}
            style={{
              textAlign: "center",
              maxWidth: "42rem",
              margin: "0 auto 2.25rem",
              lineHeight: 1.85,
            }}
          >
            {locale === "en"
              ? "Screen layout shifts by period and patron: compare the spatial pairing of the Right (East) and Left (West) screens."
              : "時代や発注背景によって屏風全体の構図形式が異なります。右隻（東側）と左隻（西側）の主役の対比を比較できます。"}
          </p>
          <RakuchuCompositionSection
            motifVisuals={builtinHubData.motifVisuals}
            stripsByTitleen={builtinHubData.stripsByTitleen}
            locale={locale}
            initialForm={formFromQuery}
          />
        </div>
      </section>
    );
    const motifsSection = (
      <section
        className={`section-grid section-padding ${choujuStyles.scrollSection}`}
      >
        <Title
          sectiontitle={
            locale === "en" ? "Key Motifs Across Scrolls" : "主要モチーフの比較"
          }
        />
        <p
          className={choujuStyles.introLead}
          style={{
            textAlign: "center",
            maxWidth: "42rem",
            margin: "0 auto 2.25rem",
            lineHeight: 1.85,
          }}
        >
          {locale === "en"
            ? "Compare how iconic Kyoto landmarks, rivers, and festivals are depicted across the three screens."
            : "京都を代表する名所・河川・祭礼が、3つの伝本それぞれにどのように描かれているかを図像で見比べられます。"}
        </p>
        <RakuchuMotifSection
          motifVisuals={builtinHubData.motifVisuals}
          locale={locale}
          highlightMotifId={motifFromQuery}
        />
      </section>
    );
    const sightseeingSection = (
      <section
        className={`section-grid section-padding ${choujuStyles.scrollSection}`}
      >
        <Title
          sectiontitle={
            locale === "en"
              ? "Kyoto Sightseeing Map & Recommended Routes"
              : "京都観光マップ・おすすめルート"
          }
        />
        <p
          className={choujuStyles.introLead}
          style={{
            textAlign: "center",
            maxWidth: "42rem",
            margin: "0 auto 2.25rem",
            lineHeight: 1.85,
          }}
        >
          {locale === "en"
            ? "Explore temples, rivers, and streets depicted in Rakuchu-Rakugai-zu screens on the map of Kyoto, and follow curated walking routes."
            : "洛中洛外図屏風に描かれた寺社・河川・町並みを現在の京都地図と照らし合わせ、テーマ別の散策ルートを辿れます。"}
        </p>
        <RakuchuSightseeingMapSection locale={locale} />
      </section>
    );
    return (
      <HubMinimalTemplate
        meta={{
          pagetitle: t("rakuchuRakugaiHub.pagetitle"),
          pageDesc: t("rakuchuRakugaiHub.metaDesc"),
          jsonLd: builtinJsonLd,
        }}
        breadcrumb={{
          name: t("rakuchuRakugaiHub.breadcrumb"),
          test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          testen: "hub",
        }}
        heroProps={{
          title: t("rakuchuRakugaiHub.introTitle"),
          description: t("rakuchuRakugaiHub.intro"),
          locale,
          boards: hubBoardLinks,
          styles: choujuStyles,
          media: builtinHubData.heroThumb ? (
            <div className={choujuStyles.heroImageWrap}>
              <Image
                src={builtinHubData.heroThumb}
                alt={t("rakuchuRakugaiHub.introTitle")}
                width={800}
                height={450}
                sizes="100vw"
                priority
                className={choujuStyles.heroImage}
              />
            </div>
          ) : null,
        }}
        worksSection={{
          id: "scrolls",
          emakis: builtinHubData.scrolls,
          sectiontitle: t("rakuchuRakugaiHub.scrollSectionTitle"),
        }}
        extraSections={[
          { id: "composition", content: compositionSection },
          { id: "sightseeing-map", content: sightseeingSection },
          { id: "motifs", content: motifsSection },
          ...extraSections,
        ]}
      />
    );
  }

  return (
    <HubMinimalTemplate
      meta={{
        pagetitle: `${title} | ${meta.siteTitle}`,
        pageDesc: description,
        jsonLd,
      }}
      breadcrumb={{
        name: title,
        test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
        testen: "hub",
      }}
      heroProps={{
        title,
        description,
        locale,
        boards: hubBoardLinks,
        styles,
        media: heroItem ? (
          <div className={styles.heroImageWrap}>
            <Image
              src={heroItem.thumb}
              alt={isEn ? heroItem.titleen : heroItem.title}
              className={styles.heroImage}
              width={1600}
              height={900}
              priority
              sizes="100vw"
            />
          </div>
        ) : null,
      }}
      worksSection={{
        id: "works",
        emakis: items,
        sectiontitle: locale === "en" ? "Explore the Scrolls" : "収録作品を鑑賞",
        sectiontitleen: "Explore the Scrolls",
        columns: "three",
        needdesc: true,
      }}
      extraSections={extraSections.length > 0 ? extraSections : undefined}
    />
  );
}

export async function getStaticPaths({ locales = ["ja", "en"] }) {
  const allHubs = getAllHubPages();
  const paths = [];
  for (const hub of allHubs) {
    for (const locale of locales) {
      paths.push({ params: { slug: hub.slug }, locale });
    }
  }
  return {
    paths,
    fallback: "blocking",
  };
}

export async function getStaticProps({ params, locale }) {
  const hub = getHubBySlug(params?.slug);
  if (!hub) {
    return { notFound: true };
  }

  const slug = params?.slug;
  let builtinHubData = null;
  if (slug === "chouju-giga") builtinHubData = buildChojuGigaHubData();
  else if (slug === "kusouzu") builtinHubData = buildKusouzuHubData();
  else if (slug === "hyakki") builtinHubData = buildHyakkiHubData();
  else if (slug === "rakuchu-rakugai") builtinHubData = buildRakuchuRakugaiHubData();

  const items = builtinHubData
    ? []
    : filterEmakisForHub(emakisData, hub).map((item) =>
        removeNestedEmakisObj(item)
      );

  return {
    props: {
      hub,
      items,
      builtinHubData,
      genjiChapters: slug === "genji-world" ? buildGenjiHubData().chapters : null,
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
    revalidate: 60,
  };
}
