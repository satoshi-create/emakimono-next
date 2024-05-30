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

  const kusouzuFlowDatas = data.filter((emaki) => emaki.title.includes("九相"));

  return (
    <main>
      <Head
        pagetitle={t.kusouzu.title}
        pageDesc={`${t.kusouzu.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.kusouzu.titleen : t.kusouzu.title}
      />
      <FlowEmaki
        flowEmakis={kusouzuFlowDatas}
        sectiontitle={t.kusouzu.title}
        sectiontitleen={t.kusouzu.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
