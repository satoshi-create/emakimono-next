import "lazysizes";
import { useRouter } from "next/router";
import FlowEmaki from "../../components/FlowEmaki";
import { useLocale, useLocaleData } from "../../libs/func";
import Breadcrumbs from "../Breadcrumbs";
import Footer from "../Footer";
import Header from "../Header";
import Head from "../Meta";

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
