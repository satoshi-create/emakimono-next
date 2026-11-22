import { HubHeroWithBoards } from "@/components/hub/HubHeroWithBoards";
import { filterBoardsForHubSlug } from "@/libs/hubPublicBoards";
import HubPageShell from "@/components/layout/HubPageShell";
import ChojuGigaScrollCard from "@/components/emaki/chouju-giga/ChojuGigaScrollCard";
import { HubScrollGridSection } from "@/components/hub/HubScrollGridSection";
import styles from "@/styles/ChoujuGigaHub.module.css";
import { buildChojuGigaHubData } from "@/utils/buildChojuGigaHubData";
import { buildChojuGigaHubJsonLd } from "@/utils/buildChojuGigaHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

const HUB_SLUG = "chouju-giga";

const heroLoader = createCloudinaryHeroLoader("g_auto");

const ChoujuGigaHub = ({ hubData }) => {
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

  const jsonLd = buildChojuGigaHubJsonLd({
    locale,
    defaultLocale,
    pageName: t("choujuGigaHub.pagetitle"),
    pageDescription: t("choujuGigaHub.metaDesc"),
    siteTitle: meta.siteTitle,
    hubData,
  });

  const hero = (
    <HubHeroWithBoards
      title={t("choujuGigaHub.introTitle")}
      description={t("choujuGigaHub.intro")}
      locale={locale}
      boards={linkedBoards}
      boardProps={{
        ariaLabel: t("choujuGigaHub.linkedPublicBoardsAria"),
      }}
      styles={styles}
      media={
        hubData.heroCloudinary || hubData.heroThumb ? (
          <div className={styles.heroImageWrap}>
            {hubData.heroCloudinary ? (
              <Image
                loader={heroLoader}
                src={hubData.heroCloudinary}
                alt={t("choujuGigaHub.introTitle")}
                width={1600}
                height={900}
                sizes="100vw"
                priority
                className={styles.heroImage}
              />
            ) : (
              <Image
                src={hubData.heroThumb}
                alt={t("choujuGigaHub.introTitle")}
                width={800}
                height={450}
                sizes="100vw"
                priority
                className={styles.heroImage}
              />
            )}
          </div>
        ) : null
      }
    />
  );

  const scrollsSection = (
    <HubScrollGridSection
      title={t("choujuGigaHub.scrollSectionTitle")}
      scrolls={hubData.scrolls}
      styles={styles}
      renderCard={(scroll) => (
        <ChojuGigaScrollCard key={scroll.titleen} scroll={scroll} />
      )}
    />
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: t("choujuGigaHub.pagetitle"),
        pageDesc: t("choujuGigaHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{
        name: t("choujuGigaHub.breadcrumb"),
        test: locale === "en" ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
        testen: "hub",
      }}
      hero={hero}
      sections={[{ id: "scrolls", content: scrollsSection }]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildChojuGigaHubData(),
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default ChoujuGigaHub;
