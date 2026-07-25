import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { useLocale } from "@/utils/func";
import parse from "html-react-parser";
import "lazysizes";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const About = () => {
  const { locale } = useRouter();
  const { t } = useLocale();

  const pageDesc =
    locale === "en"
      ? "About this project — enjoying emaki through horizontal scrolling."
      : "Aboutページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。";

  return (
    <LegalPageLayout
      pagetitle="About"
      pageDesc={pageDesc}
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
