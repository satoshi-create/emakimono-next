import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import Title from "../components/Title";
import FlowEmaki from "../components/FlowEmaki";
import { useLocale, useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import Breadcrumbs from "../components/Breadcrumbs";

const Flow = () => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const { locale } = useRouter();

  return (
    <>
      <Head />
      <Header fixed={true} />
      <Breadcrumbs
        name={locale === "en" ? "flowing scroll!!" : "流れる巻物!!"}
      />
      <FlowEmaki
        flowEmakis={data}
        sectiontitle={t.flow.title}
        sectiontitleen={t.flow.titleen}
      />
      <Footer />
    </>
  );
};

export default Flow;
