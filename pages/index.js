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
import ChaptersTable from "../components/ChaptersGenjiTable";
import FlowEmaki from "../components/FlowEmaki";

import {
  personnameItem,
  keywordItem,
  useLocale,
  genjieSlugItem,
  useLocaleData,
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

  const { t: data } = useLocaleData();

  const sikisansuizuFlowDatas = data.filter((item) => item.type === "水墨画");

  const allPersonNames = personnameItem(removeNestedArrayObj);

  const allKeywords = keywordItem(removeNestedArrayObj);

  const genjiEmakis = removeNestedArrayObj
    .filter((emaki) => emaki.title.includes("源氏"))
    .splice(0, 3);

  const kusouzuEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("九相")
  );

  const cyouzyuuEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("鳥獣人物戯画絵巻")
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

  // const [favoriteEmakisRandom, setfavoriteEmakisRandom] = useState([]);
  // const favoriteEmakis = removeNestedArrayObj.filter(
  //   (emaki) => emaki.favorite === true
  // );

  // useEffect(() => {
  //   const shuffleArray = (array) => {
  //     return array.slice().sort(() => Math.random() - Math.random());
  //   };
  //   setfavoriteEmakisRandom(shuffleArray(favoriteEmakis));
  // }, []);

  return (
    <main>
      <Head />
      <Header fixed={true} />
      <CardA
        emakis={kusouzuEmakis}
        columns={t.kusouzu.columns}
        sectiontitle={t.kusouzu.title}
        sectiontitleen={t.kusouzu.titleen}
        sectiondesc={t.kusouzu.desc}
        sectionname={t.kusouzu.name}
        linktitle={t.kusouzu.title}
        linktitleen={t.kusouzu.title}
        linkpath={"kusouzu"}
        bcg={"#f9fbff"}
      />
      <CardA
        emakis={cyouzyuuEmakis}
        columns={t.cyouzyuu.columns}
        sectiontitle={t.cyouzyuu.title}
        sectiontitleen={t.cyouzyuu.titleen}
        sectiondesc={t.cyouzyuu.desc}
        sectionname={t.cyouzyuu.name}
        linktitle={t.cyouzyuu.title}
        linktitleen={t.cyouzyuu.title}
        linkpath={"cyouzyuu"}
        // bcg={"#f9fbff"}
      />
      <CardA
        emakis={genjiEmakis}
        columns={t.genji.columns}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
        sectiondesc={t.genji.desc}
        sectionname={t.genji.name}
        linktitle={"源氏物語絵54帖万華鏡"}
        linktitleen={"Genji Picture 54 Kaleidoscope"}
        linkpath={"genji-pictures"}
        bcg={"#f9fbff"}
      />
      <FlowEmaki
        flowEmakis={sikisansuizuFlowDatas}
        sectiontitle={"四季山水図巻（山水長巻）"}
        sectiontitleen={"sessyu_sikisansuizu"}
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
