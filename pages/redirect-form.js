import "lazysizes";
import { useRouter } from "next/router";
import Button from "../components/Button";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Head from "../components/Meta";
import Title from "../components/Title";
import { useLocale, useLocaleData } from "../libs/func";

const RedirectForm = () => {
  const { locale } = useRouter();
  const { t } = useLocale();

  const { t: data } = useLocaleData();

  const cyouzyuuEmakis = data
    .filter((emaki) => emaki.title.includes("鳥獣人物戯画絵巻"))
    .splice(0, 1);
  return (
    <>
      <Head />
      <Header fixed={true} />
      {/* <Breadcrumbs
        name={locale === "en" ? "redirect-form" : "リダイレクトフォーム"}
      /> */}
      <section className="section-grid section-padding">
        <Title
          sectiontitle={"ご協力ありがとうございました！"}
          sectiontitleen={"Thank you for your cooperation!"}
        />
        {/*
        <FlowEmaki
          flowEmakis={cyouzyuuEmakis}
          // sectiontitle={"四季山水図巻（山水長巻）"}
          // sectiontitleen={"sessyu_sikisansuizu"}
          center={true}
        /> */}
        <Button title="ホームに戻る" path="/" />
      </section>
      <Footer />
    </>
  );
};

export default RedirectForm;
