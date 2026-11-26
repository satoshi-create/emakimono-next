import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import "lazysizes";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

const Custom404 = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <Head noindex />
      <Header fixed={true} />
      <Breadcrumbs name={t("notFound.breadcrumb")} />
      <section className="section-grid section-padding">
        <Title sectiontitle={t("notFound.title")} />
        <Button title={t("notFound.ctaHome")} path="/" />
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
