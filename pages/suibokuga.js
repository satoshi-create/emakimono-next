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
  const emakisData = data.filter((item) => item.type.includes("水墨画"));
  console.log(emakisData);
  return (
    <>
      <Head pagetitle={"水墨画"} pageDesc={"水墨画図鑑のページです"} />
      <Header />
      <Title pagetitle={"水墨画"} />
      <SerchForm emakis={emakisData} />
      <CardConteiner emakis={emakisData} />
      {/* <Footer /> */}
    </>
  );
}
