import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import { keywordItem, removeNestedEmakisObj } from "@/utils/func";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Emaki = ({ name, posts, nameen, slug }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const keywordName = getLocalizedField({ name, nameen }, "name", locale);
  const count = posts?.length ?? 0;
  const sampleItems = (posts ?? []).slice(0, 4);
  const sampleTitles = sampleItems
    .map((item) => getLocalizedField(item, "title", locale, item.titleen || ""))
    .filter(Boolean)
    .join(!isJa ? ", " : "・");

  const pagetitle = !isJa
    ? count > 0
      ? `${keywordName} — Japanese Picture Scrolls (${count} Works)`
      : `List of works about " ${nameen} "`
    : count > 0
      ? `「${keywordName}」の絵巻物一覧（全${count}作品）`
      : `「${name}」に関する作品一覧`;

  const pageDesc = !isJa
    ? count > 0
      ? `Explore ${count} classical Japanese picture scrolls (emakimono) tagged with "${keywordName}"${sampleTitles ? `, including ${sampleTitles}` : ""}. View full scrolls with high-resolution horizontal zoom and commentary.`
      : `You can enjoy picture scrolls, folding screens, etc. related to "${name}" in vertical and horizontal scrolling mode.`
    : count > 0
      ? `「${keywordName}」をテーマにした日本の絵巻物・古典絵画全${count}作品を収録。${sampleTitles ? `『${sampleTitles}』などの` : ""}全場面を、高精細な横スクロール・拡大ズーム・現代語解説付きで鑑賞できます。`
      : `「${name}」に関する絵巻物・屏風その他を、縦書き、横スクロールで楽しむことができます。`;

  return (
    <>
      <Head pagetitle={pagetitle} pageDesc={pageDesc} />
      <Header slug={`keyword/${slug}`} />
      <Breadcrumbs
        name={!isJa ? `${nameen}` : name}
        test={!isJa ? "keyword list" : "キーワード一覧"}
        testen={"keyword/keywordlist"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={
          !isJa
            ? `List of works about " ${nameen} "`
            : `「${name}」に関する作品一覧`
        }
        sectiontitleen={
          !isJa
            ? `「${name}」に関する作品一覧`
            : `List of works about " ${nameen} "`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async (context) => {
  const tEmakisData = resolveEmakiCatalog(context?.locale);
  const slugs = keywordItem(tEmakisData).map(({ slug }) => slug);
  const paths = buildI18nStaticPaths(slugs, context?.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const keywordslug = context.params.slug;
  const { locale } = context;
  const tEmakisData = resolveEmakiCatalog(locale);
  const keyword = keywordItem(tEmakisData).find(
    ({ slug }) => slug === keywordslug
  );

  const filterdEmakisData = tEmakisData.filter((x) => {
    if (x.keyword) {
      const filterdTag = x.keyword.some((y) => y.slug === keywordslug);
      return filterdTag;
    }
  });

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      name: keyword.name,
      nameen: keyword.id,
      posts: removeNestedArrayObj,
      slug: keywordslug,
    },
  };
};

export default Emaki;
