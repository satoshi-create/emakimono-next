import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import "lazysizes";
import { useRouter } from "next/router";

const Custom404 = () => {
  const { locale } = useRouter();
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
      </section>
      <Footer />
    </>
  );
};

export default Custom404;
