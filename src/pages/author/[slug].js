import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import { authorItem, removeNestedEmakisObj } from "@/utils/func";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Author = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const tPageDesc =
    !isJa
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head
        pagetitle={
          !isJa ? `List of ${nameen}'s Works` : `${name}の作品一覧`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={!isJa ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={
          !isJa ? `List of ${nameen}'s Works` : `${name}の作品一覧`
        }
        sectiontitleen={
          !isJa ? `${name}の作品一覧` : `List of Works of${nameen}`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async (context) => {
  const tEmakisData = resolveEmakiCatalog(context.locale);
  const slugs = authorItem(tEmakisData).map(({ authoren }) => authoren);
  const paths = buildI18nStaticPaths(slugs, context.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const authorslug = context.params.slug;
  const { locale } = context;
  const tEmakisData = resolveEmakiCatalog(locale);
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
      ...(await serverSideTranslations(locale, ["common"])),
      name: authorObj.author,
      nameen: authorObj.authoren,
      posts: filterdEmakisData,
      slug: authorslug,
    },
  };
};

export default Author;
