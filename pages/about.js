import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import styles from "../styles/About.css.module.css";
import Title from "../components/Title";
import Breadcrumbs from "../components/Breadcrumbs";
import { useRouter } from "next/router";

const About = () => {
  const { locale } = useRouter();
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "about" : "ご挨拶"} />
      <section className="section-grid section-padding">
        <Title sectiontitle={"ご挨拶"} sectiontitleen={"about"} />
        <h1 className={styles.title}>絵巻物本来の見方を目指して</h1>
        <p className={styles.text}>
          絵巻物を左へ左へと少しづつ繰り展げ、スクリーン上に次々と現れては消えていく絵を追いながら、物語の世界に没入することこそが、本来の絵巻物の見方であり、絵巻物の魅力です。それは「絵を鑑賞する」というよりは「アニメーションを味わう」感じに近いです。絵巻物について書かれた書籍は数あれど、残念ながら繰り展げつつ見ることはできません。また、実際の絵巻物を手に取る機会も早々多くはありません。
          <br />
          <br />
          けれども、縦書き、横スクロールで無限の空間が用意できるウェブサイトならば、本来の絵巻物の見方が可能ではないか。そう考え、「横スクロールで楽しむ絵巻物」というウェブサイトを制作しました。横スクロールで「繰り展げ」ながら絵巻物を味わい、はじめて日本絵画の愉快さに触れた気がしました。
          <br />
          <br />
          絵巻物を味わうには、最初はちょっと根気がいるかもしれません。この世界にはすでに、マンガやアニメ、映画など、リッチなコンテンツが溢れていますし、読み方や見方など特に気にすることなく楽しむことができるからです。でも、ぼくは、絵巻物が描かれた時代に生きていた人たちも、現在の自分たちがマンガやアニメを楽しむのと同じような感覚で、絵巻物に接していたと思います。実際、絵巻物には流線表現や画中詞（セリフ）、異時同図（コマワリ）など、マンガやアニメを彷彿とさせる技法が多くあります。なによりも、読者が、次々に現れる絵を通して物語を追いかけるという見方は、マンガやアニメとまったく同じです。
          <br />
          <br />
          本サイトでは「鳥獣人物戯画絵巻」をはじめ、教科書などでは断片的にしか見たことがなかった数多くの絵巻物を取り上げる予定です。絵巻物は古い時代に描かれた貴重なものですから、原本の多くは散逸したり、大切に所蔵されたりしていて、利用することができません。その代わり、後世の絵師たちが描き継いだ摸本が数多く存在します。絵師の腕は様々ですが、長い時代を生き抜いてきた貴重な遺産であることに違いはありません。
          <br />
          <br />
          どうぞこのサイトで絵巻物を再発見してみてください。
        </p>
      </section>
      <Footer />
    </>
  );
};

export default About;
