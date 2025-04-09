import Breadcrumbs from "@/components/common/Breadcrumbs";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/common/Meta";
import Title from "@/components/common/Title";
import styles from "@/styles/About.css.module.css";
import { useLocale } from "@/utils/func";
import parse from "html-react-parser";
import "lazysizes";
import { useRouter } from "next/router";

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
