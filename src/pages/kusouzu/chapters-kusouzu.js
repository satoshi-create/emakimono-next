import { LinkedPublicBoards } from "@/components/hub/LinkedPublicBoards";
import HubPageShell from "@/components/layout/HubPageShell";
import KusouzuHubIntro from "@/components/emaki/kusouzu/KusouzuHubIntro";
import KusouzuHubPeople from "@/components/emaki/kusouzu/KusouzuHubPeople";
import KusouzuScrollCatalog from "@/components/emaki/kusouzu/KusouzuScrollCatalog";
import KusouzuStageGrid from "@/components/emaki/kusouzu/KusouzuStageGrid";
import { buildKusouzuHubData } from "@/utils/buildKusouzuHubData";
import { buildKusouzuHubJsonLd } from "@/utils/buildKusouzuHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

const KUSOUZU_HUB_SLUG = "kusouzu";

function parseHubSlugsFromDescription(description) {
  if (!description || typeof description !== "string") return [];
  const match = description.match(/<!--\s*hubs:\s*([^>]+)\s*-->/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function filterBoardsLinkedToHub(boards, hubSlug) {
  return (boards || []).filter((board) =>
    parseHubSlugsFromDescription(board.description).includes(hubSlug),
  );
}

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
        setLinkedBoards(filterBoardsLinkedToHub(res?.boards, KUSOUZU_HUB_SLUG));
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
    <HubPageShell
      meta={{
        pagetitle: t("kusouzuHub.pagetitle"),
        pageDesc: t("kusouzuHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("kusouzuHub.breadcrumb") }}
      hero={
        <>
          <KusouzuHubIntro
            heroThumb={hubData.heroThumb}
            heroCloudinary={hubData.heroCloudinary}
          />
          <LinkedPublicBoards
            boards={linkedBoards}
            locale={locale}
            ariaLabel={t("kusouzuHub.linkedPublicBoardsAria")}
            className="section-grid section-padding"
          />
        </>
      }
      navItems={[
        { id: "stages", label: t("kusouzuHub.stageSectionTitle") },
        { id: "scrolls", label: t("kusouzuHub.scrollSectionTitle") },
        { id: "people", label: t("kusouzuHub.peopleSectionTitle") },
      ]}
      sections={[
        { id: "stages", content: <KusouzuStageGrid stages={hubData.stages} /> },
        {
          id: "scrolls",
          content: <KusouzuScrollCatalog scrollEmakis={hubData.scrollEmakis} />,
        },
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
