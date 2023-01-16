import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
// import styles from "../styles/Flow.css.module.css";
import Title from "../components/Title";
import FullscreenContents from "../components/FullscreenContents";
import dataEmakis from "../libs/data";
import { useLocale, useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import Breadcrumbs from "../components/Breadcrumbs";

const Flow = () => {

  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const { locale } = useRouter();
  
  // const heianEmakis = dataEmakis.filter((emaki) => emaki.era === "平安");
  // console.log(heianEmakis);
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "flow" : "流れる巻物"} />
      <FullscreenContents
        flowEmakis={dataEmakis}
        sectiontitle={t.flow.title}
        sectiontitleen={t.flow.titleen}
      />
      <Footer />
    </>
  );
};

// export const getStaticProps = async (context) => {
//   const { locale, locales } = context;
//   // const tEmakisData = locale === "en" ? enData : jaData;

//   const heianEmakis = dataEmakis.filter((emaki) => emaki.subtype === "説話");

//   return {
//     props: {
//       emakis: heianEmakis,
//     },
//   };
// };

export default Flow;
