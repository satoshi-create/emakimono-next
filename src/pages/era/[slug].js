import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import Title from "@/components/ui/Title";
import EmakiEraTimeline from "@/components/chronology/EmakiEraTimeline";
import {
  en as enTimelineSimple,
  ja as jaTimelineSimple,
} from "@/data/chronology/emakiTimelineSimple";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { eraItem, removeNestedEmakisObj } from "@/utils/func";
import { getLiveSlugs } from "@/utils/getLiveSlugs";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

const Emaki = ({ name, nameen, posts, slug, liveSlugs, timelineEraName }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const isJa = locale === "ja";
  const tPageDesc =
    !isJa
      ? `You can enjoy all the scenes of the ${nameen} Period in vertical and right to left scrolling mode.`
      : `${name}時代に描かれた絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          !isJa
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        pageDesc={tPageDesc}
      />
      <Header slug={`era/${slug}`} />
      <Breadcrumbs name={!isJa ? `${nameen} Period` : name} />
      <section className="section-grid section-padding">
        <Title
          sectiontitle={t("timeline.embedEraTitle", { era: timelineEraName })}
        />
        <EmakiEraTimeline eraen={slug} liveSlugs={liveSlugs} t={t} />
      </section>
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={name}
        sectiontitle={
          !isJa
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        sectiontitleen={
          !isJa
            ? `${name}時代の作品`
            : `Picture scrolls from the ${nameen} Period`
        }
      />
      <Footer />
    </>
  );
};

export default Emaki;

export const getStaticPaths = async (context) => {
  const tEmakisData = resolveEmakiCatalog(context.locale);
  const slugs = [
    ...new Set(
      eraItem(tEmakisData)
        .map(({ eraen }) => eraen)
        .filter(
          (slug) => typeof slug === "string" && slug.trim().length > 0
        )
    ),
  ];
  const paths = buildI18nStaticPaths(slugs, context.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const eraslug = context.params.slug;
  const { locale } = context;
  const isJa = locale === "ja";
  const tEmakisData = resolveEmakiCatalog(locale);

  const eraObj = eraItem(tEmakisData).find(({ eraen }) => eraen === eraslug);
  const removeNestedArrayObj = tEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });
  const filterdEmakisData = removeNestedArrayObj.filter(
    (item) => item.eraen === eraslug
  );

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      name: eraObj.era,
      nameen: eraObj.eraen,
      posts: filterdEmakisData,
      slug: eraslug,
      liveSlugs: getLiveSlugs(tEmakisData),
      timelineEraName:
        (isJa ? jaTimelineSimple : enTimelineSimple).find(
          (era) => era.eraen === eraslug
        )?.era || eraObj.era,
    },
  };
};
