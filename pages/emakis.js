import "lazysizes";
import data from "../libs/data";
import Link from "next/link";
import ResposiveImage from "../components/ResposiveImage";
import styles from "../styles/Emakis.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";
import CardConteiner from "../components/CardConteiner";
import Head from "../components/Meta";
import Title from "../components/Title";
import SerchForm from "../components/SerchForm";

export default function emakis() {
  const emakisData = data.filter((item) => item.type.includes("絵巻"));
  console.log(emakisData);
  return (
    <>
      <Head pagetitle={"絵巻"} pageDesc={"絵巻図鑑のページです"} />
      <Header />
      <Title pagetitle={"絵巻"} />
      <SerchForm />
      <CardConteiner emakis={emakisData} />
      {/* <Footer /> */}
    </>
  );
}
