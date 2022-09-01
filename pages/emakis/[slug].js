import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import EmakiConteiner from "../../components/EmakiConteiner";
import emakisData from "../../libs/data";
import Sidebar from "../../components/Sidebar";

const Emaki = ({ emakis }) => {
  const router = useRouter();
  const path = router.pathname;

  console.log(emakis);
  // console.log(router.asPath);

  // useEffect(() => {
  //   if (router.isReady) console.log(query.limit);
  // }, [query, router]);

  // const filterdEmakisData = emakisData.find(
  //   (item, index) => item.titleen === slug
  // );

  // console.log({ ...filterdEmakisData });

  return <EmakiConteiner data={{ ...emakis }} />;
};

export default Emaki;

export const getServerSideProps = async (context) => {
  const { slug } = context.params;
  console.log(slug);
  const filterdEmakisData = emakisData.find(
    (item, index) => item.titleen === slug
  );

  return {
    props: {
      emakis: filterdEmakisData,
    },
  };
};
