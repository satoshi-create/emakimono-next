import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Head from "../components/Meta";

const Cusom404 = () => {
  return (
    <main>
      <Head pagetitle={"404 - page not found"} />
      <Header fixed={false} />
      <h1>404 page not found</h1>
      <h4>ページが見つかりません</h4>
      <Footer />
    </main>
  );
};

export default Cusom404;
