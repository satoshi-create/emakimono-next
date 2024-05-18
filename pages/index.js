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
import ChaptersTable from "../components/ChaptersTable";

import {
  personnameItem,
  keywordItem,
  useLocale,
  genjieSlugItem,
} from "../libs/func";
import dataEmakis from "../libs/data";
import { gridImages } from "../libs/gridImages";
import SocialLinks from "../components/SocialLinks";
import Tweet from "../components/Tweet";
import Keywords from "../components/Keywords";
import PersonNames from "../components/PersonNames";
import ExtractingListData from "../libs/ExtractingListData";

// TODO : Firefoxで絵巻が拡大されて表示されてしまう不具合を修正する

// TODO:絵巻ページ遷移時、読み込みが遅延する不具合？を改善する
// TODO:絵巻ページ遷移時、スケルトンのようなローディング機能を追加する
// TODO:ページ遷移時にトップに戻らないようにする
// TODO:「装束から見た絵巻」を作成する
// TODO:「絵巻関連年表」を作成する
// TODO:画像の遅延読み込みをブラウザのキャッシュをクリアして検証;
// TODO:絵師名でルーティングできるようにする
// TODO:404pageを作る
// TODO:エラーハンドリングのページを作る

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

  const [favoriteEmakisRandom, setfavoriteEmakisRandom] = useState([]);
  const favoriteEmakis = removeNestedArrayObj.filter(
    (emaki) => emaki.favorite === true
  );

  useEffect(() => {
    const shuffleArray = (array) => {
      return array.slice().sort(() => Math.random() - Math.random());
    };
   setfavoriteEmakisRandom(shuffleArray(favoriteEmakis))
  }, []);

  return (
    <main>
      <Head />
      <Header fixed={true} />
      {/* <CardA
        emakis={genjiEmakis}
        columns={t.genji.columns}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.genji.name}
        linktitle={"源氏絵の世界"}
        linktitleen={"GENJIE"}
        linkpath={"genji-pictures"}
        bcg={"#f9fbff"}
      /> */}

      <CardA
        emakis={favoriteEmakisRandom}
        columns={t.favorite.columns}
        sectiontitle={t.favorite.title}
        sectiontitleen={t.favorite.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.favorite.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"/type/emaki"}
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
        linkpath={"/type/emaki"}
        bcg={"var(--clr-bcg)"}
      />
      <CardB
        columns={t.history.columns}
        sectiontitle={t.history.title}
        sectiontitleen={t.history.titleen}
        sectiondesc={t.history.desc}
        sectionname={t.history.name}
        linktitle={"絵巻"}
        linktitleen={"EMAKIMONO"}
        linkpath={"/type/emaki"}
      />
      <PersonNames
        sectiontitle={t.personname.title}
        sectiontitleen={t.personname.titleen}
        allTags={allPersonNames}
        path={"/personname/personnamelist"}
        bcg={"var(--clr-bcg)"}
      />
      <Keywords
        sectiontitle={t.indextag.title}
        sectiontitleen={t.indextag.titleen}
        allTags={allKeywords}
        path={"/keyword/keywordlist"}
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
        bcg={"var(--clr-bcg)"}
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
        linkpath={"/type/byoubu"}
      />
      <Footer />
    </main>
  );
};

export default Home;
