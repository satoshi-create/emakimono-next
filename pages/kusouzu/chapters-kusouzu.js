  import React from "react";
import ChaptersTable from "../../components/ChaptersGenjiTable";
import { kusouzuSlugItem, genjieSlugItem,useLocaleData } from "../../libs/func";
import ExtractingListData from "../../libs/ExtractingListData";
import Head from "../../components/Meta";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import ChaptersKusouzuTable from "../../components/ChaptersKusouzuTable";

const Chaptersgenjilist = () => {
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const ExistKusouzuChapters = kusouzuSlugItem(removeNestedArrayObj);

  console.log(ExistKusouzuChapters);

  const tPageDesc =
    locale === "en"
      ? `This is the page for the list of the Nine stages of decay. We are producing a list of picture scrolls with each scene of the Nine stages of decay.`
      : `九相図一覧のページです。九相図の各場面が描かれた絵巻物の一覧リストを制作しています。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "chapters-kusouzu-list" : "九相図一覧"}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={locale === "en" ? "chapters-kusouzu-list" : "九相図一覧"}
      />
      <ChaptersKusouzuTable
        sectiontitle={"九相図一覧"}
        sectiontitleen={"List of Nine stages of decay"}
        ExistKusouzuChapters={ExistKusouzuChapters}
      />
      <Footer />
    </>
  );
};

export default Chaptersgenjilist;
