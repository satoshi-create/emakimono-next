import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { useLocale } from "@/utils/func";
import parse from "html-react-parser";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const About = () => {
  const { t } = useLocale();
  const { t: tCommon } = useTranslation("common");

  return (
    <LegalPageLayout
      pagetitle="About"
      pageDesc={tCommon("about.metaDesc")}
      breadcrumbName="About"
      sectionTitle={t.about.sectiontitle}
    >
      {parse(t.about.intro)}
      <h3>For Contributors</h3>
      {parse(t.about.contributor)}
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
