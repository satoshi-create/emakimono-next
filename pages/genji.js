import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import CardA from "../components/CardA";
import CardB from "../components/CardB";
import "lazysizes";
import Head from "../components/Meta";
import Attention from "../components/Attention";
import { useLocale, useLocaleData, removeNestedObj } from "../libs/func";

// TODO:loading機能を追加する

const Genji = () => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const removeNestedArrayObj = data.map((item) => {
    return removeNestedObj(item);
  });

  const genjiEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("源氏")
  );

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
        // linktitle={"絵巻"}
        // linktitleen={"EMAKIMONO"}
        // linkpath={"emaki"}
      />
      <Footer />
    </main>
  );
};

export default Genji;
