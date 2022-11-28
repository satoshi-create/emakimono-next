import { getServerSideSitemap } from "next-sitemap";
import siteMeta from "../libs/dataSiteMeta";
import emakisData from "../libs/data";

export default function Sitemap() {}

export async function getServerSideProps(context) {
  const postFields = emakisData.map((post) => {
    return {
      loc: `${siteMeta.siteUrl}/${post.typeen}/${post.titleen}`,
    };
  });

  const allFields = [...postFields];

  return await getServerSideSitemap(context, allFields);
}
