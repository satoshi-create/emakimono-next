import allCats from "../../libs/category";
import emakisData from "../../libs/data";
import Title from "../../components/Title";
import Header from "../../components/Header";
import { useRouter } from "next/router";
import Head from "../../components/Meta";
import SerchForm from "../../components/SerchForm";
import Breadcrumbs from "../../components/Breadcrumbs";
import SortEra from "../../components/SortEra";
import CardA from "../../components/CardA";

const Emaki = ({ name, nameen, posts }) => {
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
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
  const paths = allCats.map(({ slug }) => `/category/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const catslug = context.params.slug;

  const cat = allCats.find(({ slug }) => slug === catslug);
  const filterdEmakisData = emakisData.filter(
    (item) => item.typeen === catslug
  );
  return {
    props: {
      name: cat.name,
      nameen: cat.id,
      posts: filterdEmakisData,
    },
  };
};
