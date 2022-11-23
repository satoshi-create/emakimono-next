import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import emakisData from "../libs/data";
import "lazysizes";
import Head from "../components/Meta";
import GridImages from "../components/GridImages";
import Attention from "../components/Attention";
import ToggleTag from "../components/ToggleTag";

const index = () => {
  const favoriteEmakis = emakisData.filter((emaki) => emaki.favorite === true);

  const setsuwaEmakis = emakisData.filter((emaki) => emaki.subtype === "説話");
  const kousoudenEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "高僧伝"
  );
  const buttenEmakis = emakisData.filter((emaki) => emaki.subtype === "仏典");
  const gyouziEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "諸行事・祭礼"
  );

  const variation = [
    ...setsuwaEmakis,
    ...kousoudenEmakis,
    ...buttenEmakis,
    ...gyouziEmakis,
  ];

  const typeByoubu = emakisData
    .filter((emaki) => emaki.type === "屏風")
    .splice(0, 1);
  const typeUkiyoe = emakisData
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = emakisData
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = emakisData
    .filter((emaki) => emaki.type === "西洋絵画")
    .splice(0, 1);

  const alpha = [
    ...typeByoubu,
    ...typeUkiyoe,
    ...typeSuibokuga,
    ...typeSeiyoukaiga,
  ];

  const historyemakis = [
    {
      path: "/era/heiann",
      name: "平安",
      src: "/cyoujyuu_yamazaki_kou_13-375.webp",
      eracolor: "orange",
    },
    {
      path: "/era/kamakura",
      name: "鎌倉",
      src: "/naomoto_03-1080.webp",
      eracolor: "green",
    },
    {
      path: "/era/muromachi",
      name: "室町",
      src: "/sessyu_sikisansuizu_07-1080.webp",
      eracolor: "purple",
    },
    {
      path: "/era/edo",
      name: "江戸",
      src: "/tokugawagyouretsu_32-1080.webp",
      eracolor: "skyblue",
    },
  ];

  return (
    <>
      <Head />
      <Header />
      <Attention />
      <CardA
        emakis={favoriteEmakis}
        columns={"three"}
        sectiontitle={"おすすめの絵巻"}
        sectiontitleen={"recommend"}
        sectiondesc={
          ""
        }
        sectionname={"recommend"}
      />
      <CardA
        emakis={variation}
        columns={"four"}
        sectiontitle={"さまざまな絵巻"}
        sectiontitleen={"variation"}
        sectiondesc={
          "絵巻の全盛期は平安時代末期から室町時代です。冊子形式の読書が普及するにつれ、絵巻は徐々に廃れていきました。しかし、江戸時代に入ってもなお、絵巻は描かれていましたし、明治には日本画家が絵巻を描いています。時を越えて描かれてきた絵巻には、多様な表情があり、絵巻のなかに日本の歴史の息遣いを感じることができるのです。"
        }
        sectionname={"variation"}
      />
      <CardB
        emakis={historyemakis}
        columns={"two"}
        sectiontitle={"時代から見る絵巻"}
        sectiontitleen={"history"}
        sectiondesc={""}
        sectionname={"history"}
      />
      <ToggleTag />
      <GridImages
        sectiontitle={"絵巻名場面集！"}
        sectiontitleen={"famousscene"}
        sectiondesc={""}
        sectionname={"famousscene"}
      />
      <CardA
        emakis={alpha}
        columns={"four"}
        sectiondesc={
          "横スクロールで再発見できる美術は絵巻だけではありません。たとえば、屏風や襖絵など、日本の美術品の多くは、ワイドスクリーンで作られていますし、西洋にも「バイユーのタピストリー」やフレスコ画など、数多くの絵解き美術が存在します。また。近代に入ってからは、ジャポニズムの影響を受けたモネが、連作「睡蓮」で、まるで襖絵のように部屋を取り囲んだ作品に取り組んでいます。"
        }
        sectiontitle={"横スクロールで楽しむワイド美術"}
        sectiontitleen={"＋α"}
        sectionname={"alpha"}
      />
      <Footer />
    </>
  );
};

export default index;
