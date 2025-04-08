import "lazysizes";
import { useRouter } from "next/router";
import Breadcrumbs from "../../components/Breadcrumbs";
import FlowEmaki from "../../components/FlowEmaki";
import Footer from "../../components/Footer";
import Head from "../../components/Meta";
import ExtractingListData from "../../libs/ExtractingListData";
import { useLocale, useLocaleData } from "../../libs/func";
import Header from "../Header";

// TODO:loading機能を追加する

const Genji = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  const genjiFlowDatas = data
    .filter((item) => item.title.includes("源氏"))
    .filter((item) => item.type === "屏風");

  return (
    <main>
      <Head
        pagetitle={t.genji.title}
        pageDesc={`${t.genji.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs name={locale === "en" ? t.genji.titleen : t.genji.title} />
      <FlowEmaki
        flowEmakis={genjiFlowDatas}
        sectiontitle={t.genji.title}
        sectiontitleen={t.genji.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
