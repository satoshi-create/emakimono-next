import allEras from "../../libs/era";
import emakisData from "../../libs/data";
import Header from "../../components/Header";
import Head from "../../components/Meta";
import CardA from "../../components/CardA";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useRouter } from "next/router";
import Footer from "../../components/Footer";

const Emaki = ({ name, nameen, posts }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${nameen} Period in vertical and right to left scrolling mode.`
      : `${name}に描かれた絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${nameen} Period` : name}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={locale === "en" ? `${nameen} Period` : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={name}
        sectiontitle={locale === "en" ? `${nameen} Period` : name}
        sectiontitleen={locale === "en" ? name : `${nameen} Period`}
      />
      <Footer />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async () => {
  const paths = allEras.map(({ slug }) => ({
    params: {
      slug: slug,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const eraslug = context.params.slug;

  const cat = allEras.find(({ slug }) => slug === eraslug);
  const filterdEmakisData = emakisData.filter((item) => item.eraen === eraslug);
  return {
    props: {
      name: cat.name,
      nameen: cat.nameen,
      posts: filterdEmakisData,
    },
  };
};
