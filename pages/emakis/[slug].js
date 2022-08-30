import { useRouter } from "next/router";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import EmakiConteiner from "../../components/EmakiConteiner";
import emakisData from "../../libs/data";
import Sidebar from "../../components/Sidebar";

const Emaki = () => {
  const router = useRouter();
  const { slug } = router.query;
  console.log(slug);

  const filterdEmakisData = emakisData.find(
    (item, index) => item.titleen === slug
  );

  console.log({ ...filterdEmakisData });

  return (
      <EmakiConteiner data={{ ...filterdEmakisData }} />
  );
};

export default Emaki;
