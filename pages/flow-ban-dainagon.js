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


const BanBainagon = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const bandainagonFlowDatas = data.filter((emaki) => emaki.title.includes("伴大納言絵詞"));

  return (
    <main>
      <Head
        pagetitle={t.bandainagon.title}
        pageDesc={`${t.bandainagon.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.bandainagon.titleen : t.bandainagon.title}
      />
      <FlowEmaki
        flowEmakis={bandainagonFlowDatas}
        sectiontitle={t.bandainagon.title}
        sectiondesc={t.bandainagon.desc}
        sectiontitleen={t.bandainagon.titleen}
      />
      <Footer />
    </main>
  );
};

export default BanBainagon;
