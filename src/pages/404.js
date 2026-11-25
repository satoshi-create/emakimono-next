import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import "lazysizes";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Custom404 = () => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  return (
    <>
      <Head noindex />
      <Header fixed={true} />
      <Breadcrumbs
        name={isJa ? "ページが見つかりません" : "PAGE NOT FOUND"}
      />
      <section className="section-grid section-padding">
        <Title
          sectiontitle={"ページが見つかりません"}
          sectiontitleen={"PAGE NOT FOUND"}
        />
        <Button title="ホームに戻る" path="/" />
      </section>
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

export default Custom404;
