import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import AllKusouzuChapters from "@/data/emaki-text-data/chapters-of-kusouzu.json";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { removeNestedEmakisObj } from "@/utils/func";
import { useRouter } from "next/router";


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
        testen={"kusouzu/chapters-kusouzu"}
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

  const filterdEmakisData = tEmakisData.filter((item) => {
    const filterdKusouzuslug = item.emakis.some(
      (emaki) => emaki.chapter === chapterkusouzu?.chapter
    );
    return filterdKusouzuslug;
  });

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      title: chapterkusouzu?.title || null,
      titleen: chapterkusouzu?.titleen || null,
      posts: removeNestedArrayObj,
      slug: kusouzuslugname || null,
    },
  };
};

export default Kusouzu;
