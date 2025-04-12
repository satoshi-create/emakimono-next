import FlowEmaki from "@/components/_archive_unused/FlowEmaki";
import Footer from "@/components/layout/Footer";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useLocale, useLocaleData } from "@/utils/func";
import "lazysizes";
import { useRouter } from "next/router";
import Header from "../layout/Header";

// TODO:loading機能を追加する

const Genji = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const kusouzuFlowDatas = data.filter((emaki) => emaki.title.includes("九相"));

  return (
    <main>
      <Head
        pagetitle={t.kusouzu.title}
        pageDesc={`${t.kusouzu.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.kusouzu.titleen : t.kusouzu.title}
      />
      <FlowEmaki
        flowEmakis={kusouzuFlowDatas}
        sectiontitle={t.kusouzu.title}
        sectiontitleen={t.kusouzu.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
