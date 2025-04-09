import Breadcrumbs from "@/components/common/Breadcrumbs";
import Header from "@/components/common/Header";
import Loader from "@/components/common/Loader";
import Head from "@/components/common/Meta";
import Title from "@/components/common/Title";
import RankingCard from "@/components/emaki/RankingCard";
import { AppContext } from "@/pages/_app";
import { useRouter } from "next/router";
import { useContext } from "react";

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
