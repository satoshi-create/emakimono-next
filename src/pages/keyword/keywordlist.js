import Keywords from "@/components/emaki/metadata/Keywords";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ExtractingListData from "@/utils/ExtractingListData";
import { keywordItem, useLocaleData } from "@/utils/func";
import "lazysizes";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const KeywordsComp = () => {
  const { locale } = useLocaleData();
  const isJa = locale === "ja";
  const removeNestedArrayObj = ExtractingListData();

  const allKeywords = keywordItem(removeNestedArrayObj);
  const tPageDesc = isJa
    ? `キーワード一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`
    : `This is the keyword list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`;
  return (
    <>
      <Head
        pagetitle={isJa ? "キーワード一覧" : "keyword list"}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={isJa ? "キーワード一覧" : "keyword list"} />

      <Keywords
        sectiontitle={isJa ? "キーワード一覧" : "keyword List"}
        sectiontitleen={"keyword list"}
        allTags={allKeywords}
      />
      <Footer />
    </>
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default KeywordsComp;
