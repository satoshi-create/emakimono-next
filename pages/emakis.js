import "lazysizes";
import emakisData from "../libs/data";
import Link from "next/link";
import ResposiveImage from "../components/ResposiveImage";
import styles from "../styles/Emakis.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";

export default function emakis() {
  return (
    <>
      <Header />
      <Card emakis={emakisData} />
      <Footer />
    </>
  );
}
