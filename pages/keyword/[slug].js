import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";
import {
  keywordItem,
  genjieSlugItem,
  removeNestedEmakisObj,
} from "../../libs/func";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import enData from "../../libs/en/data";
import jaData from "../../libs/data";

const Emaki = ({ name, posts, nameen, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy Emakis that match the keyword ${nameen} in vertical writing and right to left scrolling mode.`
      : `${name}というキーワードに合った絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${nameen}` : name}
        pageDesc={tPageDesc}
      />
      <Header slug={`keyword/${slug}`} />
      <Breadcrumbs
        name={locale === "en" ? `${nameen}` : name}
        test={locale === "en" ? "keyword list" : "キーワード一覧"}
        testen={"/keyword/keywordlist"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={locale === "en" ? `${nameen}` : name}
        sectiontitleen={locale === "en" ? name : `${nameen}`}
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async () => {
  console.log(keywordItem(emakisData, "name"));
  const paths = keywordItem(emakisData).map(({ slug }) => ({
    params: {
      slug: slug,
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
  const keywordslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const keyword = keywordItem(tEmakisData).find(
    ({ slug }) => slug === keywordslug
  );

  const filterdEmakisData = tEmakisData.filter((x) => {
    if (x.keyword) {
      const filterdTag = x.keyword.some((y) => y.slug === keywordslug);
      return filterdTag;
    }
  });

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      name: keyword.name,
      nameen: keyword.id,
      posts: removeNestedArrayObj,
      slug: keywordslug,
    },
  };
};

export default Emaki;
