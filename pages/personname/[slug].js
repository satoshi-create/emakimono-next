import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import allPersonNames from "../../libs/allPersonNames";
import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";

const Emaki = ({ name, posts, nameen }) => {
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Breadcrumbs name={name} test={"人物名一覧"} testen={"personnames"} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"favorite"}
        sectiontitle={name}
        sectiontitleen={nameen}
      />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = allPersonNames.map(({ slug }) => `/personname/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const personnameslug = context.params.slug;

  const personname = allPersonNames.find(({ slug }) => slug === personnameslug);

  const filterdEmakisData = emakisData.filter((x) => {
    if (x.personname) {
      const filterdTag = x.personname.some((y) => y.slug === personnameslug);
      return filterdTag;
    }
  });

  return {
    props: {
      name: personname.name,
      nameen: personname.id,
      posts: filterdEmakisData,
    },
  };
};
