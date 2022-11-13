import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import allTags from "../../libs/tag";
import emakisData from "../../libs/data";

const Emaki = ({ name, posts, nameen }) => {
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
  const paths = allTags.map(({ slug }) => `/tag/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const tagslug = context.params.slug;

  const tag = allTags.find(({ slug }) => slug === tagslug);

  const filterdEmakisData = emakisData.filter((x) => {
    if (x.tag) {
      const filterdTag = x.tag.some((y) => y.slug === tagslug);
      return filterdTag;
    }
  });
  console.log(filterdEmakisData);

  return {
    props: {
      name: tag.name,
      nameen: tag.id,
      posts: filterdEmakisData,
    },
  };
};
