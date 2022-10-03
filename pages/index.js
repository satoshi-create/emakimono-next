import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Card from "../components/Card";
import emakisData from "../libs/data";
import "lazysizes";
import CardConteiner from "../components/CardConteiner";
import Head from "../components/Meta";
import SerchForm from "../components/SerchForm";

const index = () => {
  return (
    <>
      <Head />
      <Header />
      <SerchForm emakis={emakisData} />
      <CardConteiner emakis={emakisData} />
    </>
  );
};

export default index;
