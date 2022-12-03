import { useRouter } from "next/router";
import EmakiConteiner from "../components/EmakiConteiner";
import Sidebar from "../components/Sidebar";
import Head from "../components/Meta";
import Controller from "../components/Controller";
import emakisData from "../libs/data";
import enData from "../libs/en/data";
import jaData from "../libs/data";

const Emaki = ({ emakis ,locales}) => {

  return (
    <>
      <Head
        pagetitle={`${emakis.title}${emakis.edition ? emakis.edition : ""}`}
        pageAuthor={emakis.author}
        pageDesc={emakis.metadesc}
        pageImg={emakis.thumb}
        pageImgW={emakis.thumb.width}
        pageImgH={emakis.thumb.height}
        pageType={emakis.type}
      />
      <Controller value={emakis} />
      <Sidebar value={emakis} />
      <EmakiConteiner data={{ ...emakis }} />
    </>
  );
};

// export const getStaticPaths: GetStaticPaths = async () => {
//   const paths = categories.map(c => ({
//     params: {
//       slug: c.slug as string,
//     },
//     locale: 'ja',
//   }))
//   // 英語に対してもpathを作成
//   paths.push(...paths.map(p => ({ ...p, locale: 'en' })))

//   return {
//     paths,
//     fallback: false
//   }
// }

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
  const { locale ,locales} = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const filterdEmakisData = tEmakisData.find(
    (item, index) => item.titleen === slug
  );

  return {
    props: {
      emakis: filterdEmakisData,
      locales,
    },
  };
};

export default Emaki;
