import HubPageShell from "@/components/layout/HubPageShell";
import CardA from "@/components/ui/CardA";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { useLocaleMeta } from "@/hooks/useLocale";
import { buildLocaleUrl, SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import styles from "@/styles/ByobuHub.module.css";
import { removeNestedEmakisObj } from "@/utils/emakiList";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

/** 屏風の識別子。データ正本（image-metadata-cache）の typeen と一致させる */
const BYOBU_TYPEEN = "byobu";

/** 正本データから屏風のみを抽出し、ネストした emakis（シーン配列）を除去する */
const filterByobuItems = (data = emakisData) =>
  data
    .filter((item) => item.typeen === BYOBU_TYPEEN)
    .map((item) => removeNestedEmakisObj(item));

/** JSON-LD: CollectionPage + ItemList + BreadcrumbList */
const buildByobuJsonLd = ({ locale, defaultLocale, t, meta, items }) => {
  const pageUrl = buildLocaleUrl(locale, "/byobu", defaultLocale);

  const itemListElement = items
    .filter((item) => item.titleen)
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title || item.titleen,
      url: buildLocaleUrl(locale, `/${item.titleen}`, defaultLocale),
    }));

  const graph = [
    {
      "@type": "CollectionPage",
      "@id": pageUrl,
      name: t("byobuHub.pagetitle"),
      description: t("byobuHub.metaDesc"),
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
          name: t("byobuHub.breadcrumb"),
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
};

const Byobu = ({ items }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  const jsonLd = buildByobuJsonLd({
    locale,
    defaultLocale,
    t,
    meta,
    items,
  });

  const heroItem = items.find((item) => item.thumb);

  const hero = (
    <section className={styles.hero}>
      {heroItem && (
        <div className={styles.heroImageWrap}>
          <Image
            src={heroItem.thumb}
            alt={locale === "en" ? heroItem.titleen : heroItem.title}
            width={1600}
            height={900}
            sizes="100vw"
            priority
            className={styles.heroImage}
          />
        </div>
      )}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>{t("byobuHub.introTitle")}</h1>
        <p className={styles.introLead}>{t("byobuHub.intro")}</p>
      </div>
    </section>
  );

  const listSection = (
    <CardA
      emakis={items}
      columns={"three"}
      sectiontitle={t("byobuHub.scrollSectionTitle")}
      sectiontitleen={t("byobuHub.scrollSectionTitleEn")}
      needdesc
    />
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: t("byobuHub.pagetitle"),
        pageDesc: t("byobuHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("byobuHub.breadcrumb") }}
      hero={hero}
      sections={[{ id: "byobu", content: listSection }]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      items: filterByobuItems(),
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};

export default Byobu;
