import React from "react";
import ChaptersTable from "../../components/ChaptersTable";
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

console.log(ExistGenjiChapters);

  const tPageDesc =
    locale === "en"
      ? `It is on the page of Tale of Genji 54.This site pursues the enjoyment of picture scrolls by scrolling from right to `
      : `源氏物語54帖のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;
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
      <ChaptersTable
        sectiontitle={"源氏物語54帖"}
        sectiontitleen={"The Tale of Genji 54 chapters"}
        ExistGenjiChapters={ExistGenjiChapters}
      />
      <Footer />
    </>
  );
};

export default Chaptersgenjilist;
