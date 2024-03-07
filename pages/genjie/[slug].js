import AllChapterGenji from "../../libs/genji/chapters_of_genji";
import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import enData from "../../libs/en/data";
import jaData from "../../libs/data";
import { removeNestedObj } from "../../libs/func";

const Genjie = ({ title, titleen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${titleen} Period in vertical and right to left scrolling mode.`
      : `${title}に描かれた絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${titleen} Period` : title}
        pageDesc={tPageDesc}
      />
      <Header slug={`era/${slug}`} />
      <Breadcrumbs name={locale === "en" ? `${titleen} Period` : title} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={title}
        sectiontitle={locale === "en" ? `${titleen} Period` : title}
        sectiontitleen={locale === "en" ? title : `${titleen} Period`}
      />
      <Footer />
    </>
  );
};

export default Genjie;

export const getStaticPaths = async () => {
  const paths = AllChapterGenji.map(({ path }) => ({
    params: {
      slug: path,
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
  const genjieslug = context.params.slug;

  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const chaptergenji = AllChapterGenji.find(({ path }) => path === genjieslug);
  const filterdEmakisData = tEmakisData.filter((item) => {
    // if (item.genjieslug) {
    //   return item.genjieslug.includes(genjieslug);
    // }
    return item.genjieslug === genjieslug;
  });
  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedObj(item);
  });

  return {
    props: {
      title: chaptergenji.title,
      titleen: chaptergenji.path,
      posts: removeNestedArrayObj,
      slug: genjieslug,
    },
  };
};
