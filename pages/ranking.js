import { useContext } from "react";
import RankingCard from "../components/RankingCard";
import Head from "../components/Meta";
import Header from "../components/Header";
import Title from "../components/Title";
import Loader from "../components/Loader";
import { AppContext } from "../pages/_app";

const Ranking = () => {
  const { loading } = useContext(AppContext);
  return (
    <main>
      <Head
        pagetitle={"絵巻物ランキング"}
        pageDesc={
          "絵巻物ランキングのページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。"
        }
      />
      <Header fixed={true} />
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
