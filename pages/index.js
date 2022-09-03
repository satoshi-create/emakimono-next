import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Card from "../components/Card";
import emakisData from "../libs/data";
import "lazysizes";
import CardConteiner from "../components/CardConteiner";
import Head from "../components/Meta";

const index = () => {
  return (
    <>
      <Head/>
      <Header />
      <CardConteiner emakis={emakisData} />
      {/* <Footer /> */}
    </>
  );
};

export default index;
