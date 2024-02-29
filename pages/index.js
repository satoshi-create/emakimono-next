import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import GridImageList from "../components/GridImageList";
import Attention from "../components/Attention";
import Link from "next/link";
import {
  personnameItem,
  keywordItem,
  useLocale,
} from "../libs/func";
import dataEmakis from "../libs/data";
import { gridImages } from "../libs/gridImages";
import SocialLinks from "../components/SocialLinks";
import Tweet from "../components/Tweet";
import Keywords from "../components/Keywords";
import PersonNames from "../components/PersonNames";
import ExtractingListData from "../components/ExtractingListData";

// TODO:絵巻ページ遷移時、読み込みが遅延する不具合？を改善する
// TODO:絵巻ページ遷移時、スケルトンのようなローディング機能を追加する
// TODO:ページ遷移時にトップに戻らないようにする
// TODO:「装束から見た絵巻」を作成する
// TODO:「絵巻関連年表」を作成する
// TODO:画像の遅延読み込みをブラウザのキャッシュをクリアして検証;
// TODO:絵師名でルーティングできるようにする

const Home = () => {
  const { t } = useLocale();
  const removeNestedArrayObj = ExtractingListData();

  const cyouzyuuzinbutugiga = removeNestedArrayObj.find(
    (item, index) =>
      item.title === "鳥獣人物戯画絵巻" && item.edition === "甲巻"
  );

  const suibokuga = removeNestedArrayObj.find(
    (item, index) => item.title === "四季山水図巻（山水長巻）"
  );
  const mone = removeNestedArrayObj.find(
    (item, index) => item.title === "睡蓮 連作"
  );

  const seiyoukaiga = removeNestedArrayObj.find(
    (seiyoukaiga) => seiyoukaiga.title === "ブランカッチ礼拝堂 装飾画"
  );

  const allPersonNames = personnameItem(removeNestedArrayObj);

  const allKeywords = keywordItem(removeNestedArrayObj);

  const genjiEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("源氏")
  );

  const favoriteEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.favorite === true
  );
  const setsuwaEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.subtype === "説話"
  );
  const kousoudenEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.subtype === "高僧伝"
  );
  const buttenEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.subtype === "仏典"
  );
  const gyouziEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.subtype === "諸行事・祭礼"
  );

  const variation = [
    ...setsuwaEmakis,
    ...kousoudenEmakis,
    ...buttenEmakis,
    ...gyouziEmakis,
  ];
  const flowEmakis = [cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone];

  const typeByoubu = removeNestedArrayObj
    .filter((emaki) => emaki.type === "屏風")
    .splice(0, 1);
  const typeUkiyoe = removeNestedArrayObj
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = removeNestedArrayObj
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = removeNestedArrayObj
    .filter((emaki) => emaki.type === "西洋絵画")
    .splice(0, 1);

  const alpha = [
    ...typeByoubu,
    ...typeUkiyoe,
    ...typeSuibokuga,
    ...typeSeiyoukaiga,
  ];

  return (
    <main>
      <Head />
      <Header fixed={true} />
      <Attention />
      <CardA
        emakis={genjiEmakis}
        columns={t.genji.columns}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.genji.name}
        linktitle={"源氏絵の世界"}
        linktitleen={"GENJIE"}
        linkpath={"genji"}
      />
      <CardA
        emakis={favoriteEmakis}
        columns={t.favorite.columns}
        sectiontitle={t.favorite.title}
        sectiontitleen={t.favorite.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.favorite.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"/category/emaki"}
      />

      <CardA
        emakis={variation}
        columns={t.variation.columns}
        sectiontitle={t.variation.title}
        sectiontitleen={t.variation.titleen}
        sectiondesc={t.variation.desc}
        sectionname={t.variation.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"/category/emaki"}
        bcg={"white"}
      />
      <CardB
        columns={t.history.columns}
        sectiontitle={t.history.title}
        sectiontitleen={t.history.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.history.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"/category/emaki"}
      />
      <PersonNames
        sectiontitle={t.personname.title}
        sectiontitleen={t.personname.titleen}
        allTags={allPersonNames}
        path={"personname"}
        bcg={"white"}
      />
      <Keywords
        sectiontitle={t.indextag.title}
        sectiontitleen={t.indextag.titleen}
        allTags={allKeywords}
        path={"keyword"}
      />
      <GridImageList
        images={gridImages}
        sectiontitle={t.famousscene.title}
        sectiontitleen={t.famousscene.titleen}
        sectiondesc={t.famousscene.desc}
        sectionname={t.famousscene.name}
        linktitle={"絵巻名場面集"}
        linktitleen={"famousscene"}
        linkpath={"famousscene"}
        columns={t.favorite.columns}
        slice={true}
        bcg={"white"}
      />
      <CardA
        emakis={alpha}
        columns={t.alpha.columns}
        sectiontitle={t.alpha.title}
        sectiontitleen={t.alpha.titleen}
        sectiondesc={t.alpha.desc}
        sectionname={t.alpha.name}
        linktitle={"ワイド美術"}
        linktitleen={"Side-scrolling art"}
        linkpath={"/category/byoubu"}
      />
      {/* <div style={{ float: "left", clear: "both" }} ref={scrollRef}></div> */}
      {/* <Tweet /> */}
      <Footer />
    </main>
  );
};

// export const getStaticProps = async (context) => {
//   const { locale, locales } = context;
//   // const tEmakisData = locale === "en" ? enData : jaData;
//   const removeNestedArrayObj = dataEmakis.map((item) => {
//     return removeNestedObj(item);
//   });

//   const cyouzyuuzinbutugiga = removeNestedArrayObj.find(
//     (item, index) =>
//       item.title === "鳥獣人物戯画絵巻" && item.edition === "甲巻"
//   );

//   const suibokuga = removeNestedArrayObj.find(
//     (item, index) => item.title === "四季山水図巻（山水長巻）"
//   );
//   const mone = removeNestedArrayObj.find(
//     (item, index) => item.title === "睡蓮 連作"
//   );

//   const seiyoukaiga = removeNestedArrayObj.find(
//     (seiyoukaiga) => seiyoukaiga.title === "ブランカッチ礼拝堂 装飾画"
//   );

//   return {
//     props: {
//       cyouzyuuzinbutugiga: cyouzyuuzinbutugiga,
//       seiyoukaiga: seiyoukaiga,
//       suibokuga: suibokuga,
//       mone: mone,
//     },
//   };
// };

export default Home;
