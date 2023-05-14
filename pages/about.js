import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import styles from "../styles/About.css.module.css";
import Title from "../components/Title";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";
import { useLocale, useLocaleData } from "../libs/func";

const About = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  return (
    <>
      <Head />
      <Header fixed={true} />
      <Breadcrumbs name={locale === "en" ? "about" : "ご挨拶"} />
      <section className="section-grid section-padding">
        <Title sectiontitle={"ご挨拶"} sectiontitleen={"about"} />
        <h1 className={styles.title}>絵巻物本来の見方を目指して</h1>
        <p
          dangerouslySetInnerHTML={{ __html: t.about.text }}
          className={styles.text}
        ></p>
      </section>
      <Footer />
    </>
  );
};

export default About;
