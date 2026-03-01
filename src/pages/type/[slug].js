import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { getScrollList } from "@/libs/api/scrollService";
import { removeNestedEmakisObj, typeItem } from "@/utils/func";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Type = ({ name, nameen, posts, slug }) => {
  const { locale } = useRouter();
  const tPageDesc =
    locale === "en"
      ? `This is the ${nameen} list page.This site pursues the enjoyment of picture scrolls by scrolling from right to left!`
      : `${name}一覧のページです。縦書き、横スクロールで、絵巻物本来の見方を楽しむことを追求しているサイトです。`;

  return (
    <>
      <Head
        pagetitle={locale === "en" ? `${nameen} gallary` : `${name}一覧`}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs name={locale === "en" ? nameen : name} />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        sectiontitle={locale === "en" ? `${nameen} gallary` : `${name}一覧`}
        sectiontitleen={locale === "en" ? `${name}一覧` : `List of ${nameen}`}
      />
      <Footer />
    </>
  );
};

export default Type;

export const getStaticPaths = async (context) => {
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const paths = typeItem(tEmakisData).map(({ typeen }) => ({
    params: {
      slug: typeen,
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
  const catslug = context.params.slug;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const typeObj = typeItem(tEmakisData).find(
    ({ typeen }) => typeen === catslug
  );

  // index.js と同様: Supabase から一覧取得し、titleen をマージ。失敗時は image-metadata-cache を使用
  let posts;
  try {
    let scrollList = await getScrollList();
    if (scrollList.length > 0) {
      scrollList = scrollList.map((s) => {
        const cached = tEmakisData.find((c) => c.id === s.id);
        return {
          ...s,
          titleen: cached?.titleen ?? s.scroll_id,
          type: cached?.type ?? "絵巻",
          typeen: cached?.typeen ?? "emaki",
        };
      });
      const filterdByType = scrollList.filter((item) => item.typeen === catslug);
      posts = filterdByType.map((m) => ({
        id: m.id,
        title: m.title,
        titleen: m.titleen ?? m.scroll_id,
        thumb: m.thumbnail,
        author: m.author,
        authoren: m.author,
        era: m.era,
        eraen: m.era,
        desc: m.description ?? "",
        type: m.type ?? "絵巻",
        typeen: m.typeen ?? "emaki",
        keyword: m.keyword ?? [],
        edition: "",
      }));
    } else {
      const removeNestedArrayObj = tEmakisData.map((item) =>
        removeNestedEmakisObj(item)
      );
      posts = removeNestedArrayObj.filter(
        (item) => item.typeen === catslug
      );
    }
  } catch (e) {
    console.warn("Supabase getScrollList failed, using fallback:", e?.message);
    const removeNestedArrayObj = tEmakisData.map((item) =>
      removeNestedEmakisObj(item)
    );
    posts = removeNestedArrayObj.filter(
      (item) => item.typeen === catslug
    );
  }

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      name: typeObj.type,
      nameen: typeObj.typeen,
      posts,
      slug: catslug,
    },
  };
};
