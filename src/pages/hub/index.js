import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HubPageShell from "@/components/layout/HubPageShell";
import emakisData from "@/data/scroll-metadata";
import { useLocaleMeta } from "@/hooks/useLocale";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import { filterEmakisForHub, getAllHubPages } from "@/libs/hubPages";

function buildHubIndexJsonLd({ locale, defaultLocale, meta, hubs }) {
  const isEn = locale === "en";
  const pageTitle = isEn
    ? "Curated Themes & Hub Directory"
    : "テーマ・特集ハブ一覧";
  const pageDesc = isEn
    ? "Explore curated themes and special collections of Japanese picture scrolls and folding screens."
    : "鳥獣戯画・九相図・百鬼夜行・洛中洛外図など、テーマ別の特集ハブ一覧から絵巻物・屏風を鑑賞できます。";
  const pageUrl = buildLocaleUrl(locale, "/hub", defaultLocale);

  const itemListElement = hubs.map((hub, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: isEn ? hub.titleEn || hub.titleJa : hub.titleJa,
    url: buildLocaleUrl(locale, hub.path, defaultLocale),
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

export default function HubIndexPage({ hubs }) {
  const { locale, defaultLocale } = useRouter();
  const { t: meta } = useLocaleMeta();
  const isEn = locale === "en";

  const pageTitle = isEn
    ? "Curated Themes & Hub Directory"
    : "テーマ・特集ハブ一覧";
  const pageDesc = isEn
    ? "Explore curated themes and special collections of Japanese picture scrolls and folding screens."
    : "鳥獣戯画・九相図・百鬼夜行・洛中洛外図・源氏物語など、テーマごとの特集一覧ページから作品を比較・鑑賞できます。";

  const jsonLd = buildHubIndexJsonLd({
    locale,
    defaultLocale,
    meta,
    hubs,
  });

  const hero = (
    <section
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "28px 16px 8px",
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "#92400e",
          background: "#fef3c7",
          border: "1px solid #fde68a",
          borderRadius: 999,
          padding: "3px 10px",
          marginBottom: 10,
        }}
      >
        {isEn ? "CURATED THEMES" : "テーマ別特集"}
      </div>
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(1.45rem, 2.6vw, 2rem)",
          fontWeight: 700,
          color: "var(--clr-text, #141414)",
        }}
      >
        {pageTitle}
      </h1>
      <p
        style={{
          margin: 0,
          fontSize: "0.95rem",
          lineHeight: 1.65,
          color: "#57534e",
          maxWidth: 760,
        }}
      >
        {pageDesc}
      </p>
    </section>
  );

  const gridSection = (
    <section
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "20px 16px 48px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {hubs.map((hub) => {
          const title = isEn ? hub.titleEn || hub.titleJa : hub.titleJa;
          const desc = isEn
            ? hub.descriptionEn || hub.descriptionJa
            : hub.descriptionJa;

          return (
            <Link href={hub.path} key={hub.slug} locale={locale} passHref>
              <a
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#ffffff",
                  border: "1px solid rgba(20, 20, 20, 0.1)",
                  borderRadius: 12,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  transition: "transform 0.16s ease, box-shadow 0.16s ease",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "#f5f5f4",
                    overflow: "hidden",
                  }}
                >
                  {hub.coverThumb ? (
                    <Image
                      alt={title}
                      layout="fill"
                      objectFit="cover"
                      sizes="(max-width: 768px) 100vw, 360px"
                      src={hub.coverThumb}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#a8a29e",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {title}
                    </div>
                  )}

                  {hub.workCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        right: 10,
                        bottom: 10,
                        background: "rgba(20, 20, 20, 0.78)",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      {isEn
                        ? `${hub.workCount} works`
                        : `${hub.workCount}作品収録`}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    padding: "14px 16px 16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "var(--clr-text, #141414)",
                      }}
                    >
                      {title}
                    </h2>
                    {!hub.isBuiltin && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isEn ? "New" : "新着"}
                      </span>
                    )}
                  </div>

                  {desc && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "0.84rem",
                        lineHeight: 1.55,
                        color: "#57534e",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {desc}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#b45309",
                    }}
                  >
                    <span>
                      {isEn ? "Explore theme →" : "特集ページを見る →"}
                    </span>
                    {hub.linkedBoardId && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#047857",
                          fontWeight: 600,
                        }}
                      >
                        📌 ボード連動
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: `${pageTitle} | ${meta.siteTitle}`,
        pageDesc,
        jsonLd,
      }}
      breadcrumb={{ name: pageTitle }}
      hero={hero}
      sections={[{ id: "hub-directory", content: gridSection }]}
    />
  );
}

export async function getStaticProps({ locale }) {
  const allHubs = getAllHubPages();
  const enrichedHubs = allHubs.map((hub) => {
    const matched = filterEmakisForHub(emakisData, hub);
    const firstWithThumb = matched.find((item) => item?.thumb);
    return {
      ...hub,
      workCount: matched.length,
      coverThumb: firstWithThumb?.thumb || "",
    };
  });

  return {
    props: {
      hubs: enrichedHubs,
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
    revalidate: 60,
  };
}
