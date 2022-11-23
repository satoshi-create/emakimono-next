import allEras from "../../libs/era";
import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";

const Emaki = ({ name, nameen, posts }) => {
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}の絵巻物を、縦書き横スクロールでご覧になることができます`} />
      <Header />
      <Breadcrumbs name={name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"favorite"}
        pagetitle={name}
        sectiontitle={name}
        sectiontitleen={nameen}
      />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = allEras.map(({ slug }) => `/era/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const eraslug = context.params.slug;

  const cat = allEras.find(({ slug }) => slug === eraslug);
  const filterdEmakisData = emakisData.filter((item) => item.eraen === eraslug);
  console.log(filterdEmakisData);
  return {
    props: {
      name: cat.name,
      nameen: cat.id,
      posts: filterdEmakisData,
    },
  };
};
