import { useLocale, useLocaleData } from "@/utils/func";
import "lazysizes";
import { useRouter } from "next/router";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import Head from "../meta/Meta";
import Breadcrumbs from "../navigation/Breadcrumbs";
import FlowEmaki from "./FlowEmaki";

const BanBainagon = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  const { t: data } = useLocaleData();

  const bandainagonFlowDatas = data.filter((emaki) =>
    emaki.title.includes("伴大納言絵詞")
  );

  return (
    <main>
      <Head
        pagetitle={t.bandainagon.title}
        pageDesc={`${t.bandainagon.title}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`}
      />
      <Header fixed={false} />
      <Breadcrumbs
        name={locale === "en" ? t.bandainagon.titleen : t.bandainagon.title}
      />
      <FlowEmaki
        flowEmakis={bandainagonFlowDatas}
        sectiontitle={t.bandainagon.title}
        sectiondesc={t.bandainagon.desc}
        sectiontitleen={t.bandainagon.titleen}
      />
      <Footer />
    </main>
  );
};

export default BanBainagon;
