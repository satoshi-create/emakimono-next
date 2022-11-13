import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import Tags from "../components/Tags";
import Breadcrumbs from "../components/Breadcrumbs";

const tags = () => {
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={"タグ一覧"} />
      <Tags />
      <Footer />
    </>
  );
};

export default tags;
