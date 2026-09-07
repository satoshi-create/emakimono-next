import GenjiChapterGrid from "@/components/emaki/genji/GenjiChapterGrid";
import GenjiHubIntro from "@/components/emaki/genji/GenjiHubIntro";
import GenjiScrollCatalog from "@/components/emaki/genji/GenjiScrollCatalog";
import GenjiSourcesBlock from "@/components/emaki/genji/GenjiSourcesBlock";
import HubPageShell from "@/components/layout/HubPageShell";
import { buildGenjiHubData } from "@/utils/buildGenjiHubData";
import { buildGenjiHubJsonLd } from "@/utils/buildGenjiHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

const ChaptersGenjiList = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  const jsonLd = buildGenjiHubJsonLd({
    locale,
    defaultLocale,
    pageName: t("genjiHub.pagetitle"),
    pageDescription: t("genjiHub.metaDesc"),
    siteTitle: meta.siteTitle,
    hubData,
  });

  const navItems = [
    { id: "chapters", label: t("genjiHub.chapterSectionTitle") },
    { id: "sources", label: t("genjiHub.sourcesSectionTitle") },
  ];
  if (hubData.scrollEmakis?.length) {
    navItems.splice(1, 0, {
      id: "scrolls",
      label: t("genjiHub.scrollSectionTitle"),
    });
  }

  const sections = [
    {
      id: "chapters",
      content: <GenjiChapterGrid chapters={hubData.chapters} />,
    },
  ];
  if (hubData.scrollEmakis?.length) {
    sections.push({
      id: "scrolls",
      content: <GenjiScrollCatalog scrollEmakis={hubData.scrollEmakis} />,
    });
  }
  sections.push({
    id: "sources",
    content: <GenjiSourcesBlock />,
  });

  return (
    <HubPageShell
      meta={{
        pagetitle: t("genjiHub.pagetitle"),
        pageDesc: t("genjiHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("genjiHub.breadcrumb") }}
      hero={<GenjiHubIntro heroThumb={hubData.heroThumb} />}
      navItems={navItems}
      sections={sections}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildGenjiHubData(),
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default ChaptersGenjiList;
