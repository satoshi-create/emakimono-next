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
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import { eraItem, removeNestedEmakisObj } from "@/utils/func";
import { getLiveSlugs } from "@/utils/getLiveSlugs";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

const Emaki = ({ name, nameen, posts, slug, liveSlugs, timelineEraName }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${nameen} Period in vertical and right to left scrolling mode.`
      : `${name}時代に描かれた絵巻物を、縦書き、横スクロールで楽しむことができます。`;
  return (
    <>
      <Head
        pagetitle={
          locale === "en"
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        pageDesc={tPageDesc}
      />
      <Header slug={`era/${slug}`} />
      <Breadcrumbs name={locale === "en" ? `${nameen} Period` : name} />
      <section className="section-grid section-padding">
        <Title
          sectiontitle={t("timeline.embedEraTitle", { era: timelineEraName })}
        />
        <EmakiEraTimeline eraen={slug} liveSlugs={liveSlugs} t={t} open />
      </section>
      <CardA
        emakis={posts}
        columns={"three"}
        sectionname={"recommend"}
        pagetitle={name}
        sectiontitle={
          locale === "en"
            ? `Picture scrolls from the ${nameen} Period`
            : `${name}時代の作品`
        }
        sectiontitleen={
          locale === "en"
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
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const paths = eraItem(tEmakisData).map(({ eraen }) => ({
    params: {
      slug: eraen,
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
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

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
        (locale === "en" ? enTimelineSimple : jaTimelineSimple).find(
          (era) => era.eraen === eraslug
        )?.era || eraObj.era,
    },
  };
};
