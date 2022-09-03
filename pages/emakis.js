import "lazysizes";
import emakisData from "../libs/data";
import Link from "next/link";
import ResposiveImage from "../components/ResposiveImage";
import styles from "../styles/Emakis.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";
import CardConteiner from "../components/CardConteiner";
import Head from "../components/Meta";

export default function emakis() {
  return (
    <>
      <Head pagetitle={"絵巻図鑑"} pageDesc={"絵巻図鑑のページです"} />
      <Header />
      <CardConteiner emakis={emakisData} />
      {/* <Footer /> */}
    </>
  );
}
