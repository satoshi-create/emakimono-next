import { useRouter } from "next/router";
import Breadcrumbs from "../../components/Breadcrumbs";
import CardA from "../../components/CardA";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import { eraItem, removeNestedEmakisObj } from "../../libs/func";
import {
  default as enData,
  default as jaData,
} from "../../libs/image-metadata-cache/image-metadata-cache.json";

const Emaki = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${nameen} Period in vertical and right to left scrolling mode.`
      : `${name}時代に描かれた絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          locale === "en"
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        pageDesc={tPageDesc}
      />
      <Header slug={`era/${slug}`} />
      <Breadcrumbs name={locale === "en" ? `${nameen} Period` : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={name}
        sectiontitle={
          locale === "en"
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        sectiontitleen={
          locale === "en"
            ? `${name}時代の作品`
            : `Picture scrolls from the ${nameen} Period`
        }
      />
      <Footer />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async (context) => {
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const paths = eraItem(tEmakisData).map(({ eraen }) => ({
    params: {
      slug: eraen,
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
  const eraslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const eraObj = eraItem(tEmakisData).find(({ eraen }) => eraen === eraslug);
  const removeNestedArrayObj = tEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });
  const filterdEmakisData = removeNestedArrayObj.filter(
    (item) => item.eraen === eraslug
  );

  return {
    props: {
      name: eraObj.era,
      nameen: eraObj.eraen,
      posts: filterdEmakisData,
      slug: eraslug,
    },
  };
};
