import Breadcrumbs from "@/components/common/Breadcrumbs";
import CardA from "@/components/common/CardA";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/common/Meta";
import {
  default as emakisData,
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { keywordItem, removeNestedEmakisObj } from "@/libs/utils/func";
import { useRouter } from "next/router";

const Emaki = ({ name, posts, nameen, slug }) => {
  const { locale } = useRouter();

  const tPageDesc =
    locale === "en"
      ? `You can enjoy picture scrolls, folding screens, etc. related to "${name}" in vertical and horizontal scrolling mode.`
      : `「${name}」に関する絵巻物・屏風その他を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          locale === "en"
            ? `List of works about " ${nameen} "`
            : `「${name}」に関する作品一覧`
        }
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
        sectiontitle={
          locale === "en"
            ? `List of works about " ${nameen} "`
            : `「${name}」に関する作品一覧`
        }
        sectiontitleen={
          locale === "en"
            ? `「${name}」に関する作品一覧`
            : `List of works about " ${nameen} "`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async () => {
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
