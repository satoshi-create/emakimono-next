import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import enData from "../../libs/data";
import jaData from "../../libs/data";
import { removeNestedEmakisObj, kusouzuSlugItem } from "../../libs/func";
import AllKusouzuChapters from "../../libs/kusouzu/chapters-of-kusouzu.json";

const Kusouzu = ({ title, titleen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `From the list of the Nine stages of decay, you can enjoy nine-phase diagrams drawn on the theme of the "${title}" scrolling vertically or horizontally.`
      : `九相図一覧より「${title}」巻をテーマに描いた九相図を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          locale === "en"
            ? `"${titleen}" from the list of the Nine stages of decay`
            : `九相図一覧より「${title}」`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={locale === "en" ? titleen : title}
        test={
          locale === "en" ? "list of the Nine stages of decay" : "九相図一覧"
        }
        testen={"/kusouzu/chapters-kusouzu"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={title}
        sectiontitle={
          locale === "en"
            ? `" ${titleen} " list of the Nine stages of decay`
            : `九相図一覧より「${title}」`
        }
        sectiontitleen={
          locale === "en"
            ? `九相図一覧より「${title}」`
            : `" ${titleen} " list of the Nine stages of decay`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = AllKusouzuChapters.map(({ titleen }) => ({
    params: {
      slug: titleen,
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
  const kusouzuslugname = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

    const chapterkusouzu = AllKusouzuChapters.find(
      (item) => item.titleen === kusouzuslugname
  );

  // const filterdEmakisData = tEmakisData.filter((x) => {
  //   if (x.kusouzuslug) {
  //     const filterdKusouzuslug = x.kusouzuslug.some(
  //       (y) => y.id === chapterkusouzu.stage_en
  //     );
  //     return filterdKusouzuslug;
  //   }
  // });
  const filterdEmakisData = tEmakisData.filter((item) => {
      const filterdKusouzuslug = item.emakis.some(
        (emaki) => emaki.chapter === chapterkusouzu.stage_en
      );
      return filterdKusouzuslug;
  });


  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      title: chapterkusouzu.title || null,
      titleen: chapterkusouzu.titleen || null,
      posts: removeNestedArrayObj,
      slug: kusouzuslugname || null,
    },
  };
};

export default Kusouzu;
