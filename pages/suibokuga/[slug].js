import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import EmakiConteiner from "../../components/EmakiConteiner";
import emakisData from "../../libs/data";
import Sidebar from "../../components/Sidebar";
import Head from "../../components/Meta";
import Controller from "../../components/Controller";

const Emaki = ({ emakis }) => {
  const router = useRouter();
  const path = router.pathname;

  return (
    <>
      <Head
        pagetitle={`${emakis.title}${emakis.edition ? emakis.edition : ""}`}
        pageAuthor={emakis.author}
        pageDesc={emakis.metadesc}
        pageImg={emakis.thumb}
        pageImgW={emakis.thumb.width}
        pageImgH={emakis.thumb.height}
        pageType={emakis.type}
      />
      <Controller value={emakis} />
      <Sidebar value={emakis} />

      <EmakiConteiner data={{ ...emakis }} />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const suibokuData = emakisData.filter((item) => item.type.match("水墨画"));
  console.log(suibokuData);
  const paths = suibokuData.map((item) => `/suibokuga/${item.titleen}`);
  console.log(paths);
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const filterdEmakisData = emakisData.find(
    (item, index) => item.titleen === slug
  );
  console.log(filterdEmakisData);

  return {
    props: {
      emakis: filterdEmakisData,
    },
  };
};
