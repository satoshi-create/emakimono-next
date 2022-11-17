import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";

import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";
import { keywordItem } from "../../libs/func";

const Emaki = ({ name, posts, nameen }) => {
  return (
    <>
      <Head pagetitle={name} pageDesc={`${name}のページです`} />
      <Header />
      <Breadcrumbs name={name} test={"キーワード一覧"} testen={"keywords"} />
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
  const paths = keywordItem(emakisData).map(({ slug }) => `/keyword/${slug}`);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const keywordslug = context.params.slug;

  const keyword = keywordItem(emakisData).find(
    ({ slug }) => slug === keywordslug
  );

  const filterdEmakisData = emakisData.filter((x) => {
    if (x.keyword) {
      const filterdTag = x.keyword.some((y) => y.slug === keywordslug);
      return filterdTag;
    }
  });

  return {
    props: {
      name: keyword.name,
      nameen: keyword.id,
      posts: filterdEmakisData,
    },
  };
};
