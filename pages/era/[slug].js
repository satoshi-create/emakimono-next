import allEras from "../../libs/era";
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
  // const filterdEmakisData = emakisData.find((item) => item.typeen === "ukiyoe");
  console.log(posts);
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Breadcrumbs name={name} />
      <Title pagetitle={name} />
      <SerchForm emakis={posts} />
      <SortEra emakis={posts} />
      {/* <CardConteiner emakis={posts} /> */}
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
      posts: filterdEmakisData,
    },
  };
};
