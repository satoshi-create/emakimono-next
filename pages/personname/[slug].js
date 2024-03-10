import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";
import { personnameItem, removeNestedEmakisObj } from "../../libs/func";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import enData from "../../libs/en/data";
import jaData from "../../libs/data";

const Emaki = ({ name, posts, nameruby, nameen, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy Emakis that match the person name ${nameen} in vertical writing and right to left scrolling mode.`
      : `${name}という人物名に合った絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${nameen}` : name}
        pageDesc={tPageDesc}
      />
      <Header slug={`personname/${slug}`} />
      <Breadcrumbs
        name={locale === "en" ? `${nameen}` : name}
        test={locale === "en" ? "personname list" : "人物名一覧"}
        testen={"/personname/personnamelist"}
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

export default Emaki;

export const getStaticPaths = async () => {
  const paths = personnameItem(emakisData).map(({ slug }) => ({
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
  const personnameslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const personname = personnameItem(tEmakisData).find(
    ({ slug }) => slug === personnameslug
  );

  const filterdEmakisData = tEmakisData.filter((x) => {
    if (x.personname) {
      const filterdTag = x.personname.some((y) => y.slug === personnameslug);

      return filterdTag;
    }
  });

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      name: personname.name,
      nameruby: personname.ruby,
      nameen: personname.id,
      posts: removeNestedArrayObj,
      slug: personnameslug,
    },
  };
};
