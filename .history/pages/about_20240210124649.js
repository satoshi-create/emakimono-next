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
import GridImages from "../components/GridImages";
import { gridImages } from "../libs/gridImages";

const About = () => {
  const { locale } = useRouter();
  const { t } = useLocale();
  return (
    <>
      <Head />
      <Header fixed={true} />
      <Breadcrumbs name={locale === "en" ? "about" : "ご挨拶"} />

      <section className="section-grid section-padding">
        <Title
          sectiontitle={t.about.sectiontitle}
          sectiontitleen={t.about.sectiontitleen}
        />
        <h1 className={styles.title}>{t.about.title}</h1>
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