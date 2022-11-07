import allCats from "../../libs/category";
import emakisData from "../../libs/data";
import Title from "../../components/Title";
import Header from "../../components/Header";
import CardConteiner from "../../components/CardConteiner";
import { useRouter } from "next/router";
import Head from "../../components/Meta";
import SerchForm from "../../components/SerchForm";

const Emaki = ({ name, posts }) => {
  // const filterdEmakisData = emakisData.find((item) => item.typeen === "ukiyoe");
  console.log(posts);
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Title pagetitle={name} />
      <SerchForm emakis={posts} />
      <CardConteiner emakis={posts} />
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
  console.log(filterdEmakisData);
  return {
    props: {
      name: cat.name,
      posts: filterdEmakisData,
    },
  };
};
