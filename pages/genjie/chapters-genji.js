import React from "react";
import ChaptersGenjiTable from "../../components/ChaptersGenjiTable";
import { genjieSlugItem, useLocaleData } from "../../libs/func";
import ExtractingListData from "../../libs/ExtractingListData";
import Head from "../../components/Meta";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";

const Chaptersgenjilist = () => {
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const ExistGenjiChapters = genjieSlugItem(removeNestedArrayObj);


  const tPageDesc =
    locale === "en"
      ? `The Tale of Genji 54 chapters page. This is a list of "wide art" such as picture scrolls and folding screens depicting scenes from each of the 54 chapters of The Tale of Genji.`
      : `源氏物語54帖のページです。源氏物語54帖の各場面が描かれた絵巻や屏風などの「ワイド美術」の一覧リストを制作しています`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "chapters genji list" : "源氏物語54帖一覧"}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={locale === "en" ? "chapters genji list" : "源氏物語54帖一覧"}
      />
      <ChaptersGenjiTable
        sectiontitle={"源氏物語54帖"}
        sectiontitleen={"List of The Tale of Genji 54 chapters"}
        ExistGenjiChapters={ExistGenjiChapters}
      />
      <Footer />
    </>
  );
};

export default Chaptersgenjilist;
