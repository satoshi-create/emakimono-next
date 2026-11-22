import HubMinimalTemplate from "@/components/hub/HubMinimalTemplate";
import { filterBoardsForHubSlug } from "@/libs/hubPublicBoards";
import { HYAKKI_HUB_PATH } from "@/libs/constants/links";
import styles from "@/styles/ChoujuGigaHub.module.css";
import { buildHyakkiHubData } from "@/utils/buildHyakkiHubData";
import { useLocaleMeta } from "@/utils/func";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

const HUB_SLUG = "hyakki";

const HyakkiHub = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();
  const [linkedBoards, setLinkedBoards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPublicBoards();
        if (cancelled) return;
        const boards = Array.isArray(res?.boards) ? res.boards : [];
        setLinkedBoards(filterBoardsForHubSlug(boards, HUB_SLUG));
      } catch {
        if (!cancelled) setLinkedBoards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageUrl =
    locale === defaultLocale
      ? `https://emakimono.com${HYAKKI_HUB_PATH}`
      : `https://emakimono.com/${locale}${HYAKKI_HUB_PATH}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("hyakkiHub.pagetitle"),
    description: t("hyakkiHub.metaDesc"),
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: meta.siteTitle,
      url: "https://emakimono.com",
    },
    hasPart: hubData.scrolls.map((s) => ({
      "@type": "VisualArtwork",
      name: locale === "en" ? s.titleen : s.title,
      url:
        locale === defaultLocale
          ? `https://emakimono.com/${s.titleen}`
          : `https://emakimono.com/${locale}/${s.titleen}`,
    })),
  };

  return (
    <HubMinimalTemplate
      meta={{
        pagetitle: t("hyakkiHub.pagetitle"),
        pageDesc: t("hyakkiHub.metaDesc"),
        jsonLd,
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
        boards: linkedBoards,
        boardProps: {
          ariaLabel: t("hyakkiHub.linkedPublicBoardsAria"),
          untitledLabel: t("hyakkiHub.linkedPublicBoardUntitled"),
          itemCountLabel: (count) =>
            t("hyakkiHub.linkedPublicBoardItemCount", { count }),
        },
        styles,
        media: hubData.heroThumb ? (
          <div className={styles.heroImageWrap}>
            <Image
              src={hubData.heroThumb}
              alt={t("hyakkiHub.introTitle")}
              width={800}
              height={450}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          </div>
        ) : null,
      }}
      worksSection={{
        id: "scrolls",
        emakis: hubData.scrolls,
        sectiontitle: t("hyakkiHub.scrollSectionTitle"),
      }}
    />
  );
};

export const getStaticProps = async ({ locale }) => ({
  props: {
    hubData: buildHyakkiHubData(),
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default HyakkiHub;
