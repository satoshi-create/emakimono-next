import RankingCard from "@/components/emaki/ranking/RankingCard";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Loader from "@/components/ui/Loader";
import Title from "@/components/ui/Title";
import { AppContext } from "@/pages/_app";
import { useRouter } from "next/router";
import { useContext } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Ranking = () => {
  const { locale } = useRouter();
  const { loading } = useContext(AppContext);
  return (
    <main>
      <Head
        pagetitle={"絵巻物ランキング"}
        pageDesc={
          "絵巻物ランキングのページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。"
        }
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? "Ranking of EMAKIMONO" : "絵巻物ランキング"}
      />
      <section className={"section-grid section-padding"}>
        <Title
          sectiontitle={"絵巻物ランキング"}
          sectiontitleen={"ranking of emakimono"}
        />
        {loading ? <Loader /> : <RankingCard />}
      </section>
    </main>
  );
};

export default Ranking;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
