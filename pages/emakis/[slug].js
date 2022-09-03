import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
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
        pagetitle={emakis.title}
        pageDesc={emakis.desc}
      />
      <Controller value={emakis} />
      <Sidebar value={emakis} />
      <EmakiConteiner data={{ ...emakis }} />
    </>
  );
};

export default Emaki;

export const getServerSideProps = async (context) => {
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
