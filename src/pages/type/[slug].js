import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import {
  default as enData,
  default as jaData,
} from "@/data/scroll-metadata";
import { removeNestedEmakisObj, typeItem } from "@/utils/func";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Type = ({ name, nameen, posts = [], slug }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const tPageDesc = isJa
    ? `${name}一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`
    : `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`;

  return (
    <>
      <Head
        pagetitle={isJa ? `${name}一覧` : `${nameen} gallary`}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={isJa ? name : nameen} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={isJa ? `${name}一覧` : `${nameen} gallary`}
        sectiontitleen={isJa ? `List of ${nameen}` : `${name}一覧`}
      />
      <Footer />
    </>
  );
};

export default Type;

export const getStaticPaths = async (context) => {
  const { locales = ["ja", "en", "zh-Hans", "zh-Hant"] } = context;

  const validSlugs = [
    ...new Set(
      typeItem(enData)
        .map(({ typeen }) => typeen)
        .filter((slug) => typeof slug === "string" && slug.trim().length > 0)
        .map((slug) => slug.trim())
    ),
  ];
  const paths = validSlugs.flatMap((slug) =>
    locales.map((loc) => ({ params: { slug }, locale: loc }))
  );
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "ja" ? jaData : enData;

  const typeObj = typeItem(tEmakisData).find(
    ({ typeen }) => typeen === catslug
  );
  const removeNestedArrayObj = tEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });
  const filterdEmakisData = removeNestedArrayObj.filter(
    (item) => item.typeen === catslug
  );

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      name: typeObj.type,
      nameen: typeObj.typeen,
      posts: filterdEmakisData,
      slug: catslug,
    },
  };
};
