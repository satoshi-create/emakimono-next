import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import PersonNames from "@/components/personname/PersonNames";
import { default as cacheData } from "@/data/image-metadata-cache/image-metadata-cache.json";
import { personProfileItem } from "@/utils/func";
import "lazysizes";
import { useRouter } from "next/router";
import { DISPLAY_PERSON_SLUGS } from "@/libs/constants/displayPersonSlugs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const PersonnamesComp = () => {
  const { locale } = useRouter();
  // cache（閲覧可能絵巻）のみで集計し、表示対象人物に絞る
  const allPersonNames = personProfileItem(cacheData).filter((p) =>
    DISPLAY_PERSON_SLUGS.includes(p.slug)
  );
  const tPageDesc =
    locale === "en"
      ? `This is the personnames list page. This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `人物名一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "personnames list" : "人物名一覧"}
        pageDesc={tPageDesc}
      />
      <Header slug={"personnames"} />
      <Breadcrumbs name={locale === "en" ? "personnames list" : "人物名一覧"} />
      <PersonNames
        sectiontitle={locale === "en" ? "personnames list" : "人物名一覧"}
        sectiontitleen={"keywords"}
        allTags={allPersonNames}
      />
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

export default PersonnamesComp;
