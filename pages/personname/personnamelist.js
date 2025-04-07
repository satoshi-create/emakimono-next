import React from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import "lazysizes";
import Head from "../../components/Meta";
import PersonNames from "../../components/PersonNames";
import Breadcrumbs from "../../components/Breadcrumbs";
import emakisData from "../../libs/data";
import { personnameItem, useLocaleData } from "../../libs/func";
import ExtractingListData from "../../libs/ExtractingListData";

const PersonnamesComp = () => {
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();
  const allPersonNames = personnameItem(removeNestedArrayObj);
  console.log(allPersonNames);

  const tPageDesc =
    locale === "en"
      ? `This is the personnames list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `人物名一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "personnames list" : "人物名一覧"}
        pageDesc={tPageDesc}
      />
      <Header slug={"personnames"} />
      <Breadcrumbs name={locale === "en" ? "personnames list" : "人物名一覧"} />
      <PersonNames
        sectiontitle={"人物名一覧"}
        sectiontitleen={"keywords"}
        allTags={allPersonNames}
      />
      <Footer />
    </>
  );
};

export default PersonnamesComp;
