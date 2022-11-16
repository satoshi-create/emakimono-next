import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import Keywords from "../components/Keywords";
import Breadcrumbs from "../components/Breadcrumbs";
import allPersonNames from "../libs/allPersonNames";

const personnames = () => {
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={"人物名一覧"} />
      <Keywords
        sectiontitle={"人物名一覧"}
        sectiontitleen={"keywords"}
        allTags={allPersonNames}
        path={"personname"}
      />
      <Footer />
    </>
  );
};

export default personnames;
