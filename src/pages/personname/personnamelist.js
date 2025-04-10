import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import PersonNames from "@/components/personname/PersonNames";
import ExtractingListData from "@/utils/ExtractingListData";
import { personnameItem, useLocaleData } from "@/utils/func";
import "lazysizes";

const PersonnamesComp = () => {
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();
  const allPersonNames = personnameItem(removeNestedArrayObj);
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
