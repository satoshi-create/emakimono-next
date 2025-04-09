import Breadcrumbs from "@/components/Breadcrumbs";
import Header from "@/components/Header";
import Loader from "@/components/Loader";
import Head from "@/components/Meta";
import RankingCard from "@/components/RankingCard";
import Title from "@/components/Title";
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
