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
  const removeNestedArrayObj = ExtractingListData();

  const genjiFlowDatas = data
    .filter((item) => item.title.includes("源氏"))
    .filter((item) => item.type === "屏風");

  return (
    <main>
      <Head
        pagetitle={t.genji.title}
        pageDesc={`${t.genji.title}のページです。屏風に描かれた源氏絵を、縦書き・横スクロールで一気に鑑賞することができます。`}
      />
      <Header fixed={false} />
      <Breadcrumbs name={locale === "en" ? t.genji.titleen : t.genji.title} />
      <FlowEmaki
        flowEmakis={genjiFlowDatas}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
