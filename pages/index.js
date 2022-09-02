import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Card from "../components/Card";
import emakisData from "../libs/data";
import "lazysizes";


const index = () => {
  return (
    <>
      <Header />
      <Card emakis={emakisData} />
      <Footer />
    </>
  );
};

export default index;
