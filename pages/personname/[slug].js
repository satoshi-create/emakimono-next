import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import emakisData from "../../libs/data";
import Breadcrumbs from "../../components/Breadcrumbs";
import { personnameItem } from "../../libs/func";

const Emaki = ({ name, posts, nameruby }) => {
  return (
    <>
      <Head
        pagetitle={name}
        pageDesc={`${name}（${nameruby}）が登場する絵巻物を、縦書き横スクロールでご覧になることができます`}
      />
      <Header />
      <Breadcrumbs name={name} test={"人物名一覧"} testen={"personnames"} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={name}
        sectiontitleen={nameruby}
      />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = personnameItem(emakisData).map(
    ({ slug }) => `/personname/${slug}`
  );
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
      posts: filterdEmakisData,
    },
  };
};
