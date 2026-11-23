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
  getDynamicHubPages,
  getHubBySlug,
} from "@/libs/hubPages";
import { fetchCollabBoard, fetchPublicBoards } from "@/libs/api/ugcApi";
import { removeNestedEmakisObj } from "@/utils/emakiList";
import { buildGenjiHubData } from "@/utils/buildGenjiHubData";
import GenjiChaptersSection from "@/components/genji/GenjiChaptersSection";
import styles from "@/styles/ByobuHub.module.css";

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

export default function DynamicHubPage({ hub, items, genjiChapters }) {
  const { locale, defaultLocale } = useRouter();
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
  const dynamicHubs = getDynamicHubPages();
  const paths = [];
  for (const hub of dynamicHubs) {
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
  if (!hub || hub.isBuiltin) {
    return { notFound: true };
  }

  const items = filterEmakisForHub(emakisData, hub).map((item) =>
    removeNestedEmakisObj(item)
  );

  const slug = params?.slug;
  return {
    props: {
      hub,
      items,
      genjiChapters: slug === "genji-world" ? buildGenjiHubData().chapters : null,
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
    revalidate: 60,
  };
}
