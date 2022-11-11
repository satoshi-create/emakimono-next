import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Card from "../components/Card";
import emakisData from "../libs/data";
import "lazysizes";
import Head from "../components/Meta";

const index = () => {
  const favoriteEmakis = emakisData.filter((emaki) => emaki.favorite === true);

  const setsuwaEmakis = emakisData.filter((emaki) => emaki.subtype === "説話");
  const kousoudenEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "高僧伝"
  );
  const buttenEmakis = emakisData.filter((emaki) => emaki.subtype === "仏典");
  const gyouziEmakis = emakisData.filter(
    (emaki) => emaki.subtype === "諸行事・祭礼"
  );

  const variation = [
    ...setsuwaEmakis,
    ...kousoudenEmakis,
    ...buttenEmakis,
    ...gyouziEmakis,
  ];

  console.log(variation);

  const typeByoubu = emakisData
    .filter((emaki) => emaki.type === "屏風")
    .splice(0, 1);
  const typeUkiyoe = emakisData
    .filter((emaki) => emaki.type === "浮世絵")
    .splice(0, 1);
  const typeSuibokuga = emakisData
    .filter((emaki) => emaki.type === "水墨画")
    .splice(0, 1);
  const typeSeiyoukaiga = emakisData
    .filter((emaki) => emaki.type === "西洋絵画")
    .splice(0, 1);

  const alpha = [
    ...typeByoubu,
    ...typeUkiyoe,
    ...typeSuibokuga,
    ...typeSeiyoukaiga,
  ];

  return (
    <>
      <Head />
      <Header />
      <Card
        emakis={favoriteEmakis}
        columns={"three"}
        pagetitle={"三大絵巻"}
        sectionname={"favorite"}
      />
      <Card
        emakis={variation}
        columns={"four"}
        pagetitle={"さまざまな絵巻"}
        sectionname={"variation"}
      />
      <Card
        emakis={alpha}
        columns={"two"}
        pagetitle={"＋α"}
        sectionname={"alpha"}
      />
      <Footer />
    </>
  );
};

export default index;
