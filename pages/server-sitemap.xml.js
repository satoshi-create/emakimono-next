import { getServerSideSitemap } from "next-sitemap";
import siteMeta from "../libs/constants";
import emakisData from "../libs/data";

export default function Sitemap() {}

console.log(getServerSideProps());

export async function getServerSideProps(context) {
  const postFields = emakisData.map((post) => {
    return {
      loc: `${siteMeta.siteUrl}/${post.titleen}`,
    };
  });

  const allFields = [...postFields];

  return await getServerSideSitemap(context, allFields);
}
