import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";
import emakisData from "../libs/data";
import enData from "../libs/en/data";
import jaData from "../libs/data";
import Footer from "../components/Footer";
import FullScreenComp from "../components/FullScreenComp";
import Translate from "../components/Translate";

const Emaki = ({ emakis, locale, locales, slug }) => {
  console.log(emakis.thumb.width);

  const pagetitle = `${emakis.title} ${emakis.edition ? emakis.edition : ""}`;
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the${pagetitle} ${
          emakis.author && `（${emakis.author}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle} ${
          emakis.author && `（${emakis.author}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const jsonData = {
    "@context": "http://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${locale}/emakimono.com/${slug}`,
    },
    headline: pagetitle,
    description: tPageDesc,
    url: `https://${locale}/emakimono.com/${slug}`,
    image: {
      "@type": "ImageObject",
      url: emakis.thumb,
      width: "533px",
      height: "300px",
    },
    author: {
      "@type": "Person",
      name: "太郎",
    },
    publisher: {
      "@type": "Organization",
      name: "横スクロールで楽しむ絵巻",
      logo: {
        "@type": "ImageObject",
        url: "/favicon.png",
      },
    },
  };
  const jsonLd = JSON.stringify(jsonData, null, " ");

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageAuthor={emakis.author}
        pageDesc={emakis.metadesc}
        pageImg={emakis.thumb}
        pageImgW={emakis.thumb.width}
        pageImgH={emakis.thumb.height}
        pageType={emakis.type}
        jsonLd={jsonLd}
      />
      <FullScreenComp right={"4rem"}>
        <Translate
          emakipage={{
            position: "absolute",
            "z-index": "100",
            top: "1rem",
            right: "6rem",
          }}
          slug={slug}
        />
        <Controller value={emakis} />
        <Sidebar value={emakis} />
        <EmakiConteiner data={{ ...emakis }} height={"100vh"} scroll={true} />
      </FullScreenComp>
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = emakisData.map((item) => ({
    params: {
      slug: item.titleen,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const filterdEmakisData = tEmakisData.find(
    (item, index) => item.titleen === slug
  );

  return {
    props: {
      emakis: filterdEmakisData,
      locales,
      locale,
      slug,
    },
  };
};

export default Emaki;
