import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import Keywords from "../components/Keywords";
import Breadcrumbs from "../components/Breadcrumbs";
import allKeywords from "../libs/allKeywords";

const keywords = () => {
  return (
    <>
      <Head pagetitle={"キーワード"} pageDesc={`キーワード一覧のページです`} />
      <Header />
      <Breadcrumbs name={"キーワード一覧"} />
      <Keywords
        sectiontitle={"キーワード"}
        sectiontitleen={"keywords"}
        allTags={allKeywords}
        path={"keyword"}
      />
      <Footer />
    </>
  );
};

export default keywords;
