import HubMinimalTemplate from "@/components/hub/HubMinimalTemplate";
import { filterBoardsForHubSlug } from "@/libs/hubPublicBoards";
import KusouzuHubIntro from "@/components/emaki/kusouzu/KusouzuHubIntro";
import KusouzuHubPeople from "@/components/emaki/kusouzu/KusouzuHubPeople";
import KusouzuStageGrid from "@/components/emaki/kusouzu/KusouzuStageGrid";
import styles from "@/styles/KusouzuHub.module.css";
import { buildKusouzuHubData } from "@/utils/buildKusouzuHubData";
import { buildKusouzuHubJsonLd } from "@/utils/buildKusouzuHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

const KUSOUZU_HUB_SLUG = "kusouzu";

const ChaptersKusouzulist = ({ hubData }) => {
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
        setLinkedBoards(filterBoardsForHubSlug(boards, KUSOUZU_HUB_SLUG));
      } catch {
        if (!cancelled) setLinkedBoards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const jsonLd = buildKusouzuHubJsonLd({
    locale,
    defaultLocale,
    pageName: t("kusouzuHub.pagetitle"),
    pageDescription: t("kusouzuHub.metaDesc"),
    siteTitle: meta.siteTitle,
    hubData,
  });

  return (
    <HubMinimalTemplate
      meta={{
        pagetitle: t("kusouzuHub.pagetitle"),
        pageDesc: t("kusouzuHub.metaDesc"),
        jsonLd,
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
        boards: linkedBoards,
        boardProps: {
          ariaLabel: t("kusouzuHub.linkedPublicBoardsAria"),
        },
        styles,
        media: (
          <KusouzuHubIntro
            heroThumb={hubData.heroThumb}
            heroCloudinary={hubData.heroCloudinary}
          />
        ),
      }}
      worksSection={{
        id: "scrolls",
        emakis: hubData.scrollEmakis,
        sectiontitle: t("kusouzuHub.scrollSectionTitle"),
      }}
      navItems={[
        { id: "stages", label: t("kusouzuHub.stageSectionTitle") },
        { id: "scrolls", label: t("kusouzuHub.scrollSectionTitle") },
        { id: "people", label: t("kusouzuHub.peopleSectionTitle") },
      ]}
      extraSections={[
        { id: "stages", content: <KusouzuStageGrid stages={hubData.stages} /> },
        { id: "people", content: <KusouzuHubPeople /> },
      ]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildKusouzuHubData(),
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default ChaptersKusouzulist;
