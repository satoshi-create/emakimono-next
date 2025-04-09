import Breadcrumbs from "@/components/common/Breadcrumbs";
import Footer from "@/components/common/Footer";
import Head from "@/components/common/Meta";
import FlowEmaki from "@/components/emaki/FlowEmaki";
import { useLocale, useLocaleData } from "@/libs/func";
import ExtractingListData from "@/libs/utils/ExtractingListData";
import "lazysizes";
import { useRouter } from "next/router";
import Header from "../common/Header";

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
