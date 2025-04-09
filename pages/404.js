import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/common/Button";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/Meta";
import Title from "@/components/Title";
import { useLocale, useLocaleData } from "@/libs/func";
import "lazysizes";
import { useRouter } from "next/router";

const Custom404 = () => {
  const { locale } = useRouter();
  const { t } = useLocale();

  const { t: data } = useLocaleData();

  const chinkaEmakis = data.filter((emaki) => emaki.title === "鎮火安心図巻");
  return (
    <>
      <Head />
      <Header fixed={true} />
      <Breadcrumbs
        name={locale === "en" ? "PAGE NOT FOUND" : "ページが見つかりません"}
      />
      <section className="section-grid section-padding">
        <Title
          sectiontitle={"ページが見つかりません"}
          sectiontitleen={"PAGE NOT FOUND"}
        />
        <Button title="ホームに戻る" path="/" />
        {/* <FlowEmaki
          flowEmakis={chinkaEmakis}
          // sectiontitle={"四季山水図巻（山水長巻）"}
          // sectiontitleen={"sessyu_sikisansuizu"}
          center={true}
        /> */}
      </section>
      <Footer />
    </>
  );
};

export default Custom404;
