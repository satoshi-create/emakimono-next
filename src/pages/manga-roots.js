import { MangaRootsNetworkSection } from "@/components/manga-roots/MangaRootsPage";
import HubPageShell from "@/components/layout/HubPageShell";
import { buildMangaRootsPageData } from "@/data/mangaRoots";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { buildMangaRootsJsonLd } from "@/utils/buildMangaRootsJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const MangaRoots = ({ pageData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  const jsonLd = buildMangaRootsJsonLd({
    locale,
    defaultLocale,
    pageName: t("mangaRoots.pagetitle"),
    pageDescription: t("mangaRoots.metaDesc"),
    siteTitle: meta.siteTitle,
    themes: pageData.themes,
  });

  return (
    <HubPageShell
      meta={{
        pagetitle: t("mangaRoots.pagetitle"),
        pageDesc: t("mangaRoots.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("mangaRoots.breadcrumb") }}
      sections={[
        {
          id: "network",
          content: <MangaRootsNetworkSection graph={pageData.graph} t={t} />,
        },
      ]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      pageData: buildMangaRootsPageData(emakisData),
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  };
};

export default MangaRoots;
