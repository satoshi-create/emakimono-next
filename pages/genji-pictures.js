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
import ChaptersTable from "../components/ChaptersTable";
import FlowEmaki from "../components/FlowEmaki";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";

// TODO:loading機能を追加する

const Genji = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const genjiFlowDatas = data.filter((item) => item.title.includes("源氏"));

  return (
    <main>
      <Head />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? "The World of Genji Pictures" : "源氏絵の世界"}
      />
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
