import FlowEmaki from "@/components/emaki/FlowEmaki";
import { useLocale, useLocaleData } from "@/utils/func";
import "lazysizes";
import { useRouter } from "next/router";
import Breadcrumbs from "../common/Breadcrumbs";
import Footer from "../common/Footer";
import Header from "../common/Header";
import Head from "../common/Meta";

// TODO:loading機能を追加する

const Genji = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const cyouzyuuFlowDatas = data.filter((emaki) =>
    emaki.title.includes("鳥獣人物戯画絵巻")
  );

  return (
    <main>
      <Head
        pagetitle={t.cyouzyuu.title}
        pageDesc={`${t.cyouzyuu.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.cyouzyuu.titleen : t.cyouzyuu.title}
      />
      <FlowEmaki
        flowEmakis={cyouzyuuFlowDatas}
        sectiontitle={t.cyouzyuu.title}
        sectiontitleen={t.cyouzyuu.titleen}
      />
      <Footer />
    </main>
  );
};

export default Genji;
