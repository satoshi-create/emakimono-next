import React from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import "lazysizes";
import Head from "../../components/Meta";
import Keywords from "../../components/Keywords";
import Breadcrumbs from "../../components/Breadcrumbs";
import { keywordItem, useLocaleData } from "../../libs/func";
import ExtractingListData from "../../libs/ExtractingListData";

const KeywordsComp = () => {
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const allKeywords = keywordItem(removeNestedArrayObj);
  const tPageDesc =
    locale === "en"
      ? `This is the keyword list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `キーワード一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "keyword list" : "キーワード一覧"}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={locale === "en" ? "keyword list" : "キーワード一覧"} />

      <Keywords
        sectiontitle={"キーワード"}
        sectiontitleen={"keyword list"}
        allTags={allKeywords}
      />
      <Footer />
    </>
  );
};

export default KeywordsComp;
