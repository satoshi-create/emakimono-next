import React from "react";
import Head from "../components/Meta";
import Footer from "../components/Footer";
import Header from "../components/Header";

const about = () => {
  return (
    <>
      <Head pagetitle={"アバウト"} pageDesc={"アバウトページです"} />
      <Header />
      <div>製作中です</div>
      {/* <Footer /> */}
    </>
  );
};

export default about;
