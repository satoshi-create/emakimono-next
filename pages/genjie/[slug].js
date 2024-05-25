import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import enData from "../../libs/data";
import jaData from "../../libs/data";
import { removeNestedEmakisObj, genjieSlugItem } from "../../libs/func";

const Genjie = ({ title, titleen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy the Genji-e paintings on the theme of the "${titleen}" scroll from the 54 chapters of The Tale of Genji in both vertical and horizontal scrolling mode.`
      : `源氏物語54帖より「${title}」巻をテーマに描いた源氏絵を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          locale === "en"
            ? `"${titleen}" from The Tale of Genji, 54 chapters`
            : `源氏物語54帖より「${title}」を描いた源氏絵`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={locale === "en" ? titleen : title}
        test={locale === "en" ? "chapter genji list" : "源氏物語54帖一覧"}
        testen={"/genjie/chapters-genji"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={title}
        sectiontitle={
          locale === "en"
            ? `" Genji-e (Genji Pictures) depicting ${titleen} from The Tale of Genji`
            : `「${title}」を描いた源氏絵`
        }
        sectiontitleen={
          locale === "en"
            ? `「${title}」を描いた源氏絵`
            : `" Genji-e (Genji Pictures) depicting ${titleen} from The Tale of Genji`
        }
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

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      title: chaptergenji.title,
      titleen: chaptergenji.path,
      posts: removeNestedArrayObj,
      slug: genjieslugname,
    },
  };
};

export default Genjie;
