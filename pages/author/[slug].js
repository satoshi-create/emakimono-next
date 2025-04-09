import Breadcrumbs from "@/components/common/Breadcrumbs";
import CardA from "@/components/common/CardA";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/common/Meta";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { authorItem, removeNestedEmakisObj } from "@/libs/func";
import { useRouter } from "next/router";

const Author = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head
        pagetitle={
          locale === "en" ? `List of ${nameen}'s Works` : `${name}の作品一覧`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={locale === "en" ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={
          locale === "en" ? `List of ${nameen}'s Works` : `${name}の作品一覧`
        }
        sectiontitleen={
          locale === "en" ? `${name}の作品一覧` : `List of Works of${nameen}`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async (context) => {
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const paths = authorItem(tEmakisData).map(({ authoren }) => ({
    params: {
      slug: authoren,
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
  const authorslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const authorObj = authorItem(tEmakisData).find(
    ({ authoren }) => authoren === authorslug
  );

  const removeNestedArrayObj = tEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  const filterdEmakisData = removeNestedArrayObj.filter(
    ({ authoren }) => authoren === authorslug
  );

  return {
    props: {
      name: authorObj.author,
      nameen: authorObj.authoren,
      posts: filterdEmakisData,
      slug: authorslug,
    },
  };
};

export default Author;
