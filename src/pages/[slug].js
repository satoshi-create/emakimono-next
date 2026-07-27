import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import Head from "@/components/meta/Meta";
import MiddleNavigation from "@/components/navigation/MiddleNavigation";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { default as enData, default as jaData } from "@/data/data";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { AppContext } from "@/context/AppContext";
import { buildEmakiJsonLd } from "@/utils/buildEmakiJsonLd";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

const Emaki = ({ data, locale, locales, slug, test }) => {
  const { t } = useLocaleMeta();
  const { t: tc } = useTranslation("common");
  const { defaultLocale } = useRouter();
  const selectedRef = useRef(null);
  const {
    navIndex,
    setnavIndex,
    setHash,
    orientation,
    toggleFullscreen,
    setToggleFullscreen,
  } = useContext(AppContext);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setToggleFullscreen(false);
        screen.orientation.unlock();
      }
    };
  }, [setToggleFullscreen]);

  useEffect(() => {
    // https: qiita.com/7280ayubihs/items/0d359c3a3b5bc8a4b6fd
    // 別絵巻へ遷移した際に、縦スクロール・navIndex をリセット
    window.scrollTo({ top: 0, behavior: "instant" });
    setnavIndex(0);
    setHash(0);
  }, [slug, setnavIndex, setHash]);

  if (!data) {
    return null;
  }

  const pagetitle =
    locale === "en"
      ? data.titleen
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();

  const pageAuthor = locale === "en" ? data.authoren : data.author;

  const tPageDesc =
    locale === "en"
      ? `You can enjoy all the scenes of the ${pagetitle} ${
          pageAuthor && `（${pageAuthor}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle}${
          pageAuthor && `（${pageAuthor}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const pageDesc = locale === "en" ? data.descen : data.desc;

  const pageDescTemp = pageDesc ? pageDesc : tPageDesc;

  const jsonLd = buildEmakiJsonLd({
    locale,
    slug,
    defaultLocale,
    name: pagetitle,
    description: pageDescTemp,
    image: data.thumb,
    creatorName: pageAuthor,
    siteTitle: t.siteTitle,
    typeName: locale === "en" ? data.typeen : data.type,
    typeSlug: data.typeen,
  });

  // 教育現場向けUI: 巻末ナッジ用 - 兄弟巻は EmakiLandscapContent 内で取得
  const isKusouzu = isKusouzuScroll(data);

  const breadcrumbProps = isKusouzu
    ? {
        nameHub: tc("kusouzuHub.breadcrumb"),
        nameHubPath: "kusouzu/chapters-kusouzu",
        nameB: locale === "en" ? data.titleen : data.title,
      }
    : {
        nameA: locale === "en" ? data.typeen : data.type,
        nameAen: `type/${data.typeen}`,
        nameB: locale === "en" ? data.titleen : data.title,
      };

  const matchMediaContainer = (full, ori) => {
    if (ori === "landscape") {
      return (
        <>
          {!full && <EmakiHeader />}
          {!full && <EmakiBreadcrumbs {...breadcrumbProps} />}
          <EmakiLandscapContent
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            viewerFullscreen={full}
          />
        </>
      );
    } else if (ori === "portrait") {
      return (
        <>
          <EmakiHeader />
          <EmakiBreadcrumbs orientation={orientation} {...breadcrumbProps} />
          <EmakiPortraitContent
            data={data}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
          />
        </>
      );
    }
  };

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageAuthor={pageAuthor}
        pageDesc={pageDescTemp}
        pageImg={data.thumb}
        pageImgW={data.thumb.width}
        pageImgH={data.thumb.height}
        pageType={data.type}
        jsonLd={jsonLd}
      />
      <MiddleNavigation
        title={data.title}
        titleen={data.titleen}
        edition={data.edition}
        author={data.author}
      />
      {matchMediaContainer(toggleFullscreen, orientation)}
    </>
  );
};

export const getStaticPaths = async () => {
  const activeEmakis = emakisData.filter(
    (item) => !isWithdrawnScroll(item.titleen)
  );
  const paths = activeEmakis.map((item) => ({
    params: {
      slug: item.titleen,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const fs = require("fs");
  const path = require("path");
  const cacheDir = path.join(process.cwd(), "src/data/image-metadata-cache");
  const cacheFilePath = path.join(cacheDir, "image-metadata-cache.json");

  // キャッシュファイルが存在しない場合のエラー処理
  if (!fs.existsSync(cacheFilePath)) {
    throw new Error(
      "Image metadata cache not found. Run the generateImageMetadata script."
    );
  }

  // キャッシュファイルを読み込む
  const metadataCache = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

  const { slug } = context.params;
  const { locale, locales } = context;
  const tEmakisData = locale === "en" ? enData : jaData;
  const filterdEmakisData = metadataCache.filter(
    (item, index) => item.titleen === slug
  );

  const addObjEmakis = filterdEmakisData
    .map((item, i) => {
      const addLinkIdtoEmakis = item.emakis.map((item, i) => {
        return { ...item, linkId: i };
      });

      const addEkotobaIdEmakis = addLinkIdtoEmakis
        .filter((item) => item.cat === "ekotoba")
        .map((item, i) => {
          return { ...item, ekotobaId: i };
        });

      const concatAddObjEmakis = Array.from(
        new Set(addLinkIdtoEmakis.concat(addEkotobaIdEmakis))
      );

      const filterAddObjEmakisA = concatAddObjEmakis.filter(
        (item) => item.cat === "image"
      );
      const filterAddObjEmakisB = concatAddObjEmakis.filter(
        (item) => item.cat === "ekotoba" && item.ekotobaId >= 0
      );
      const concatFilterAddObjEmakis =
        filterAddObjEmakisA.concat(filterAddObjEmakisB);

      const sortConcatFilterAddObjEmakis = concatFilterAddObjEmakis.sort(
        (a, b) => (a.linkId > b.linkId ? 1 : -1)
      );

      return { ...item, emakis: sortConcatFilterAddObjEmakis };
    })
    .find((item) => item);

  if (!addObjEmakis) {
    return { notFound: true };
  }

  const metaFromList = tEmakisData.find((item) => item.titleen === slug);

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data: metaFromList ? { ...metaFromList, ...addObjEmakis } : addObjEmakis,
      locales,
      locale,
      slug: slug,
      test: addObjEmakis,
    },
  };
};

export default Emaki;
