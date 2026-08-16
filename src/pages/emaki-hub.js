import EmakiHubPage from "@/components/emaki/hub/EmakiHubPage";
import HubPageShell from "@/components/layout/HubPageShell";
import { HUB_EMAKIS, REGIONS, ROUTES } from "@/data/emakiHubData";
import { MEDIA_ASSOCIATIONS } from "@/data/emakiRelatedMedia";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

/** JSON-LD: CollectionPage + ItemList（実在作品のみ） */
const buildEmakiHubJsonLd = ({ locale, defaultLocale, t, meta, items }) => {
  const pageUrl = buildLocaleUrl(locale, "/emaki-hub", defaultLocale);
  const scrollItems = items
    .filter((item) => item.titleen)
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title || item.titleen,
      url: buildLocaleUrl(locale, `/${item.titleen}`, defaultLocale),
    }));

  const collectionPage = {
    "@type": "CollectionPage",
    "@id": pageUrl,
    name: t("emakiHub.pagetitle"),
    description: t("emakiHub.metaDesc"),
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: meta.siteTitle, url: SITE_ORIGIN },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: scrollItems.length,
      itemListElement: scrollItems,
    },
  };

  const breadcrumbList = {
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
        name: t("emakiHub.pagetitle"),
        item: pageUrl,
      },
    ],
  };

  // 漫画・アニメ ↔ 絵巻 の関連付け（編集的言及。外部 URL は公式サイト）
  const mediaItems = items
    .filter((item) => item.media?.length)
    .flatMap((item) =>
      item.media.map((m, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: m.titleEn || m.titleJa,
        item: m.officialUrl,
      })),
    );

  const graph = [collectionPage, breadcrumbList];
  if (mediaItems.length > 0) {
    graph.push({
      "@type": "ItemList",
      name: t("emakiHub.mediaTitle"),
      itemListElement: mediaItems,
    });
  }

  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph },
    null,
    " "
  );
};

/**
 * ルートの stops を JOIN する。
 * - titleen 指定 stop: HUB_EMAKIS の spot と image-metadata-cache の thumb/title を付与
 * - spot 直書き stop: そのまま
 */
const buildRoutes = () => {
  return ROUTES.map((route) => ({
    ...route,
    stops: route.stops.map((stop) => {
      if (!stop.titleen) return stop;
      const meta = emakisData.find((m) => m.titleen === stop.titleen);
      const hub = HUB_EMAKIS.find((h) => h.titleen === stop.titleen);
      return {
        ...stop,
        title: meta?.title || stop.title,
        thumb: meta?.thumb,
        spot: hub?.spot,
      };
    }),
  }));
};

/** メディア関連付けを emaki 側メタ（thumb/title）と JOIN する。 */
const buildMediaAssociations = () => {
  return MEDIA_ASSOCIATIONS.map((m) => ({
    ...m,
    emaki: {
      titleen: m.emakiTitleen,
      title: emakisData.find((e) => e.titleen === m.emakiTitleen)?.title || "",
      thumb: emakisData.find((e) => e.titleen === m.emakiTitleen)?.thumb || "",
    },
  }));
};

/** image-metadata-cache.json（正本）と titleen で JOIN したハブデータを構築 */
const buildHubData = () => {
  const regions = Object.values(REGIONS);
  const emakis = HUB_EMAKIS.map((item) => {
    const meta = emakisData.find((m) => m.titleen === item.titleen);
    return meta ? { ...item, ...meta } : item;
  }).map((item) => ({
    ...item,
    media: MEDIA_ASSOCIATIONS.filter((m) => m.emakiTitleen === item.titleen),
  }));
  return { regions, emakis, routes: buildRoutes(), media: buildMediaAssociations() };
};

const EmakiHub = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  const jsonLd = buildEmakiHubJsonLd({
    locale,
    defaultLocale,
    t,
    meta,
    items: hubData.emakis,
  });

  const hero = <EmakiHubPage hubData={hubData} t={t} />;

  return (
    <HubPageShell
      meta={{
        pagetitle: t("emakiHub.pagetitle"),
        pageDesc: t("emakiHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("emakiHub.breadcrumb") }}
      hero={hero}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildHubData(),
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};

export default EmakiHub;
