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

const ChaptersKusouzulist = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

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
        <KusouzuHubIntro
          heroThumb={hubData.heroThumb}
          heroCloudinary={hubData.heroCloudinary}
        />
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
