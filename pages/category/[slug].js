import allCats from "../../libs/category";
import emakisData from "../../libs/data";
import Title from "../../components/Title";
import Header from "../../components/Header";
import CardConteiner from "../../components/CardConteiner";
import { useRouter } from "next/router";
import Head from "../../components/Meta";
import SerchForm from "../../components/SerchForm";
import Breadcrumbs from "../../components/Breadcrumbs";
import SortEra from "../../components/SortEra";

const Emaki = ({ name, posts }) => {
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Breadcrumbs name={name} />
      <Title pagetitle={name} />
      <SerchForm emakis={posts} />
      <SortEra emakis={emakisData} />
      {/* <CardConteiner emakis={posts} /> */}
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
      posts: filterdEmakisData,
    },
  };
};
