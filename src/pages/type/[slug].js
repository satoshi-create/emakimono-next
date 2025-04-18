import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { removeNestedEmakisObj, typeItem } from "@/utils/func";
import { useRouter } from "next/router";

const Type = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${nameen} gallary` : `${name}一覧`}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={locale === "en" ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={locale === "en" ? `${nameen} gallary` : `${name}一覧`}
        sectiontitleen={locale === "en" ? `${name}一覧` : `List of ${nameen}`}
      />
      <Footer />
    </>
  );
};

export default Type;

export const getStaticPaths = async (context) => {
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const paths = typeItem(tEmakisData).map(({ typeen }) => ({
    params: {
      slug: typeen,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

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
      name: typeObj.type,
      nameen: typeObj.typeen,
      posts: filterdEmakisData,
      slug: catslug,
    },
  };
};
