import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import AllKusouzuChapters from "@/data/scroll-texts/kusouzu-chapters.json";
import { kusouzuStageHref } from "@/utils/buildKusouzuHubData";
import { removeNestedEmakisObj } from "@/utils/func";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Kusouzu = ({ title, titleen, posts, slug }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const tPageDesc =
    !isJa
      ? `From the list of the Nine stages of decay, you can enjoy nine-phase diagrams drawn on the theme of the "${title}" scrolling vertically or horizontally.`
      : `九相図一覧より「${title}」巻をテーマに描いた九相図を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          !isJa
            ? `"${titleen}" from the list of the Nine stages of decay`
            : `九相図一覧より「${title}」`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={!isJa ? titleen : title}
        test={
          !isJa ? "list of the Nine stages of decay" : "九相図一覧"
        }
        testen={"kusouzu/chapters-kusouzu"}
      />
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={title}
        sectiontitle={
          !isJa
            ? `" ${titleen} " list of the Nine stages of decay`
            : `九相図一覧より「${title}」`
        }
        sectiontitleen={
          !isJa
            ? `九相図一覧より「${title}」`
            : `" ${titleen} " list of the Nine stages of decay`
        }
      />
      <Footer />
    </>
  );
};

export const getStaticPaths = async (context) => {
  const slugs = AllKusouzuChapters.map(({ slug }) => slug);
  const paths = buildI18nStaticPaths(slugs, context?.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const kusouzuslugname = context.params.slug;
  const { locale } = context;
  const tEmakisData = resolveEmakiCatalog(locale);

  const chapterkusouzu = AllKusouzuChapters.find(
    (item) => item.slug === kusouzuslugname
  );

  if (!chapterkusouzu) {
    return { notFound: true };
  }

  const filterdEmakisData = tEmakisData.filter((item) =>
    Boolean(kusouzuStageHref(item, chapterkusouzu.stage_en))
  );

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    const viewerHref = kusouzuStageHref(item, chapterkusouzu.stage_en);
    return { ...removeNestedEmakisObj(item), viewerHref };
  });

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      title: chapterkusouzu.title || null,
      titleen: chapterkusouzu.titleen || null,
      posts: removeNestedArrayObj,
      slug: kusouzuslugname || null,
    },
  };
};

export default Kusouzu;
