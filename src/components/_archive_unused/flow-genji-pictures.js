import FlowEmaki from "@/components/_archive_unused/FlowEmaki";
import Footer from "@/components/layout/Footer";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useLocale, useLocaleData } from "@/libs/func";
import ExtractingListData from "@/utils/ExtractingListData";
import "lazysizes";
import { useRouter } from "next/router";
import Header from "../layout/Header";

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
