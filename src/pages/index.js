import HomeGalleryLink from "@/components/home/HomeGalleryLink";
import HomeLatestScrolls from "@/components/home/HomeLatestScrolls";
import HomeThemeCards from "@/components/home/HomeThemeCards";
import TopRanking from "@/components/emaki/ranking/TopRanking";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import CardA from "@/components/ui/CardA";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import {
  CHOUJU_GIGA_HUB_PATH,
  HOME_LATEST_TITLEEN,
  KUSOUZU_HUB_PATH,
} from "@/libs/constants/links";
import { useLocale, useLocaleMeta } from "@/utils/func";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useMemo } from "react";

const isChoujuScroll = (emaki) => emaki.title.includes("鳥獣人物戯画絵巻");

/** JSON-LD: WebPage + ItemList（テーマハブ + 注目絵巻） */
const buildHomeJsonLd = ({
  locale,
  defaultLocale,
  siteTitle,
  pageDesc,
  featuredItems,
}) => {
  const pageUrl = buildLocaleUrl(locale, "/", defaultLocale);

  const hubItems = [
    {
      name: "Chōjū-jinbutsu-giga",
      url: buildLocaleUrl(locale, CHOUJU_GIGA_HUB_PATH, defaultLocale),
    },
    {
      name: "Kusōzu",
      url: buildLocaleUrl(locale, KUSOUZU_HUB_PATH, defaultLocale),
    },
    {
      name: "Hell & Dark Fantasy",
      url: buildLocaleUrl(
        locale,
        "/emaki-hub?theme=dark-fantasy",
        defaultLocale
      ),
    },
    {
      name: "Manga Roots",
      url: buildLocaleUrl(locale, "/manga-roots", defaultLocale),
    },
  ];

  const scrollItems = featuredItems.map((item, index) => ({
    "@type": "ListItem",
    position: hubItems.length + index + 1,
    name: item.title || item.titleen,
    url: buildLocaleUrl(locale, `/${item.titleen}`, defaultLocale),
  }));

  const hubListItems = hubItems.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    url: item.url,
  }));

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": pageUrl,
          name: siteTitle,
          description: pageDesc,
          url: pageUrl,
          isPartOf: { "@type": "WebSite", name: siteTitle, url: SITE_ORIGIN },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: hubListItems.length + scrollItems.length,
            itemListElement: [...hubListItems, ...scrollItems],
          },
        },
      ],
    },
    null,
    " "
  );
};

const Home = () => {
  const { t } = useLocale();
  const { t: tCommon } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();
  const removeNestedArrayObj = ExtractingListData();

  const featuredEmakis = useMemo(
    () =>
      removeNestedArrayObj.filter(
        (e) =>
          !isChoujuScroll(e) &&
          !isKusouzuScroll(e) &&
          !HOME_LATEST_TITLEEN.includes(e.titleen)
      ),
    [removeNestedArrayObj]
  );

  const pageDesc = tCommon("home.metaDesc");
  const jsonLd = buildHomeJsonLd({
    locale,
    defaultLocale,
    siteTitle: meta.siteTitle,
    pageDesc,
    featuredItems: featuredEmakis,
  });

  return (
    <main>
      <Head
        pagetitle={tCommon("home.metaTitle")}
        pageDesc={pageDesc}
        jsonLd={jsonLd}
      />
      <Header fixed={false} />
      <section className="section-grid section-padding">
        <div className="hero">
          <h1 className="heroTitle">{t.top.title}</h1>
          <p className="heroDesc">{t.top.desc}</p>
        </div>
      </section>
      <HomeLatestScrolls />
      <TopRanking />
      <HomeThemeCards />
      {featuredEmakis.length > 0 && (
        <>
          <CardA
            emakis={featuredEmakis}
            columns="four"
            sectiontitle={tCommon("home.featuredSectionTitle")}
            sectiontitleen={tCommon("home.featuredSectionTitle")}
            bcg="var(--clr-surface)"
          />
          <HomeGalleryLink surface />
        </>
      )}
      <Footer />
    </main>
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};

export default Home;
