import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import emakisData from "../libs/data";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";

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
  const paths = emakisData.map((item) => `/${item.titleen}`);
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const filterdEmakisData = emakisData.find(
    (item, index) => item.titleen === slug
  );

  return {
    props: {
      emakis: filterdEmakisData,
    },
  };
};
