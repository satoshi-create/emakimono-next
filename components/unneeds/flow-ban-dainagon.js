import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../Footer";
import Header from "../Header";
import CardA from "../CardA";
import CardB from "../CardB";
import "lazysizes";
import Head from "../Meta";
import Attention from "../Attention";
import { useLocale, useLocaleData, genjieSlugItem } from "../../libs/func";
import ExtractingListData from "../../libs/ExtractingListData";
import FlowEmaki from "../FlowEmaki";
import Breadcrumbs from "../Breadcrumbs";
import { useRouter } from "next/router";

const BanBainagon = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const bandainagonFlowDatas = data.filter((emaki) =>
    emaki.title.includes("伴大納言絵詞")
  );

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
