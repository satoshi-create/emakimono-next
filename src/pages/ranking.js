import RankingCard from "@/components/emaki/ranking/RankingCard";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Title from "@/components/ui/Title";
import { fetchRankingPageViews } from "@/libs/api/fetchRankingPageViews";
import { buildRankingData } from "@/utils/buildRankingData";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Ranking = ({ rankingData }) => {
  const { t } = useTranslation("common");
  return (
    <main>
      <Head
        pagetitle={t("ranking.pagetitle")}
        pageDesc={t("ranking.metaDesc")}
      />
      <Header fixed={false} />
      <Breadcrumbs name={t("ranking.breadcrumb")} />
      <section className={"section-grid section-padding"}>
        <Title sectiontitle={t("ranking.sectionTitle")} />
        <RankingCard rankingData={rankingData} />
      </section>
    </main>
  );
};

export default Ranking;

export const getStaticProps = async ({ locale }) => {
  let rankingData = [];
  try {
    const pageViews = await fetchRankingPageViews();
    rankingData = buildRankingData(pageViews);
  } catch (error) {
    console.warn("Ranking getStaticProps: GA fetch failed", error.message);
  }

  return {
    props: {
      rankingData,
      ...(await serverSideTranslations(locale, ["common"])),
    },
    revalidate: 86400,
  };
};
