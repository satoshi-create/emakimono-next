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
import { genjieSlugItem } from "../../libs/func";

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

export const getStaticPaths = async () => {
  const paths = genjieSlugItem(emakisData).map(({ path }) => ({
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
  console.log(genjieSlugItem(emakisData));
  const genjieslugname = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const chaptergenji = genjieSlugItem(tEmakisData).find(
    ({ path }) => path === genjieslugname
  );
  // const filterdEmakisData = tEmakisData.filter((item) => {
  //   // if (item.genjieslug) {
  //   //   return item.genjieslug.includes(genjieslug);
  //   // }
  //   return item.genjieslug === genjieslug;
  // });
  // const removeNestedArrayObj = filterdEmakisData.map((item) => {
  //   return removeNestedObj(item);
  // });

  const filterdEmakisData = tEmakisData.filter((x) => {
    if (x.genjieslug) {
      const filterdGenjieslug = x.genjieslug.some(
        (y) => y.path === genjieslugname
      );
      return filterdGenjieslug;
    }
  });


  return {
    props: {
      title: chaptergenji.title,
      titleen: chaptergenji.path,
      posts: filterdEmakisData,
      slug: genjieslugname,
    },
  };
};

export default Genjie;
