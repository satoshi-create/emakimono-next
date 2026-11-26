import LegalPageLayout from "@/components/layout/LegalPageLayout";
import parse from "html-react-parser";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const About = () => {
  const { t } = useTranslation("common");

  return (
    <LegalPageLayout
      pagetitle={t("about.pagetitle")}
      pageDesc={t("about.metaDesc")}
      breadcrumbName={t("about.breadcrumb")}
      sectionTitle={t("about.sectionTitle")}
    >
      {parse(t("about.introHtml"))}
      <h3>{t("about.contributorHeading")}</h3>
      {parse(t("about.contributorHtml"))}
    </LegalPageLayout>
  );
};

export default About;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
