import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
// import styles from "../styles/Flow.css.module.css";
import Title from "../components/Title";
import GridImageList from "../components/GridImageL";
import dataEmakis from "../libs/data";
import { useLocale, useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import Breadcrumbs from "../components/Breadcrumbs";
import { gridImages } from "../libs/gridImages";

const Famousscene = ({ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }) => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const { locale } = useRouter();
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "famousscene" : "絵巻名場面集!!"} />
      <GridImageList
        images={gridImages}
        sectiontitle={t.famousscene.title}
        sectiontitleen={t.famousscene.titleen}
        sectiondesc={t.famousscene.desc}
        sectionname={t.famousscene.name}
      />
      <Footer />
    </>
  );
};

export default Famousscene;
