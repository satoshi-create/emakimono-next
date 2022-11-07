import "lazysizes";
import data from "../libs/data";
import Header from "../components/Header";
import CardConteiner from "../components/CardConteiner";
import Head from "../components/Meta";
import Title from "../components/Title";
import SerchForm from "../components/SerchForm";

export default function emakis() {
  const emakisData = data.filter((item) => item.type.match("西洋絵画"));
  return (
    <>
      <Head pagetitle={"西洋絵画"} pageDesc={"西洋絵画のページです"} />
      <Header />
      <Title pagetitle={"西洋絵画"} />
      <SerchForm emakis={emakisData} />
      <CardConteiner emakis={emakisData} />
      {/* <Footer /> */}
    </>
  );
}
