import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";
import { personnameItem } from "../../libs/func";
import { useRouter } from "next/router";

const Emaki = ({ name, posts, nameruby, nameen }) => {
  console.log(nameen);
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
      <Header />
      <Breadcrumbs
        name={locale === "en" ? `${nameen}` : name}
        test={locale === "en" ? "personname list" : "人物名一覧"}
        testen={"personnames"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={locale === "en" ? name : name}
        sectiontitleen={locale === "en" ? nameen : nameruby}
      />
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

  const personname = personnameItem(emakisData).find(
    ({ slug }) => slug === personnameslug
  );

  const filterdEmakisData = emakisData.filter((x) => {
    if (x.personname) {
      const filterdTag = x.personname.some((y) => y.slug === personnameslug);

      return filterdTag;
    }
  });

  return {
    props: {
      name: personname.name,
      nameruby: personname.ruby,
      nameen: personname.id,
      posts: filterdEmakisData,
    },
  };
};
