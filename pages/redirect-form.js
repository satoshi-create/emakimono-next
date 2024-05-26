import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import styles from "../styles/About.css.module.css";
import Title from "../components/Title";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";
import { useLocale, useLocaleData } from "../libs/func";
import Link from "next/link";
import Button from "../components/Button";
import FlowEmaki from "../components/FlowEmaki";

const RedirectForm = () => {
  const { locale } = useRouter();
  const { t } = useLocale();

    const { t: data } = useLocaleData();

  const cyouzyuuEmakis = data
    .filter((emaki) => emaki.title.includes("鳥獣人物戯画絵巻"))
    .splice(0, 1);
  return (
    <>
      <Head />
      <Header fixed={true} />
      {/* <Breadcrumbs
        name={locale === "en" ? "redirect-form" : "リダイレクトフォーム"}
      /> */}
      <section className="section-grid section-padding">
        <h1>ご協力ありがとうございました！</h1>
        <Button title="ホームに戻る" path="/" />
        {/* <FlowEmaki
          flowEmakis={cyouzyuuEmakis}
          // sectiontitle={"四季山水図巻（山水長巻）"}
          // sectiontitleen={"sessyu_sikisansuizu"}
        /> */}
      </section>
      <Footer />
    </>
  );
};

export default RedirectForm;
