import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import styles from "../styles/About.css.module.css";
import Title from "../components/Title";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";
import { useLocale } from "../libs/func";
import parse from "html-react-parser";

const About = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  return (
    <>
      <Head
        pagetitle={"About"}
        pageDesc={
          "Aboutページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。"
        }
      />
      <Header fixed={false} />
      <Breadcrumbs name={"about"} />
      <section className="section-grid section-padding">
        <Title sectiontitle={t.about.sectiontitle} />
        <div className={styles.text}>
          {/* <h3>About This Project</h3> */}
          {parse(t.about.intro)}
          <h3>For Contributors</h3>
          {parse(t.about.contributor)}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default About;
