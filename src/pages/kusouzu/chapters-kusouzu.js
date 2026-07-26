import KusouzuHubIntro from "@/components/emaki/kusouzu/KusouzuHubIntro";
import KusouzuScrollCatalog from "@/components/emaki/kusouzu/KusouzuScrollCatalog";
import KusouzuStageGrid from "@/components/emaki/kusouzu/KusouzuStageGrid";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
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
    <main>
      <Head
        pagetitle={t("kusouzuHub.pagetitle")}
        pageDesc={t("kusouzuHub.metaDesc")}
        jsonLd={jsonLd}
      />
      <Header />
      <Breadcrumbs name={t("kusouzuHub.breadcrumb")} />
      <KusouzuHubIntro />
      <KusouzuStageGrid stages={hubData.stages} />
      <KusouzuScrollCatalog scrollEmakis={hubData.scrollEmakis} />
      <Footer />
    </main>
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
