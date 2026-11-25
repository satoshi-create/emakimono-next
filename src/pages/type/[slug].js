import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { removeNestedEmakisObj, typeItem } from "@/utils/func";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Type = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const tPageDesc =
    !isJa
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head
        pagetitle={!isJa ? `${nameen} gallary` : `${name}一覧`}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={!isJa ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={!isJa ? `${nameen} gallary` : `${name}一覧`}
        sectiontitleen={!isJa ? `${name}一覧` : `List of ${nameen}`}
      />
      <Footer />
    </>
  );
};

export default Type;

export const getStaticPaths = async (context) => {
  const tEmakisData = resolveEmakiCatalog(context.defaultLocale ?? "ja");

  const validSlugs = [
    ...new Set(
      typeItem(tEmakisData)
        .map(({ typeen }) => typeen)
        .filter((slug) => typeof slug === "string" && slug.trim().length > 0)
        .map((slug) => slug.trim())
    ),
  ];
  const paths = buildI18nStaticPaths(validSlugs, context.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;
  const { locale } = context;
  const tEmakisData = resolveEmakiCatalog(locale);

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
