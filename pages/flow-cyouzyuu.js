import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import Attention from "../components/Attention";
import { useLocale, useLocaleData, genjieSlugItem } from "../libs/func";
import ExtractingListData from "../libs/ExtractingListData";
import FlowEmaki from "../components/FlowEmaki";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";

// TODO:loading機能を追加する

const Genji = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const cyouzyuuFlowDatas = data.filter((emaki) => emaki.title.includes("鳥獣人物戯画絵巻"));

  return (
    <main>
      <Head
        pagetitle={t.cyouzyuu.title}
        pageDesc={`${t.cyouzyuu.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.cyouzyuu.titleen : t.cyouzyuu.title}
      />
      <FlowEmaki
        flowEmakis={cyouzyuuFlowDatas}
        sectiontitle={t.cyouzyuu.title}
        sectiontitleen={t.cyouzyuu.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
