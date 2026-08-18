import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import ClassicalFontLink from "@/components/meta/ClassicalFontLink";
import Head from "@/components/meta/Meta";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { OGP_IMAGE_FALLBACKS } from "@/libs/constants/emakiOgImages";
import { AppContext } from "@/context/AppContext";
import { buildEmakiJsonLd } from "@/utils/buildEmakiJsonLd";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
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

  // 九相図巻（kusouzumaki）は概念語・情報系クエリ（九相図とは・一覧・順番）を
  // title タグに含め、SERP クリック率の向上を図る。H1（data.title）は変えない。
  const seoTitleSuffix =
    isKusouzuScroll(data) && data.titleen === "kusouzumaki"
      ? "｜九相図とは・一覧・順番"
      : "";

  const pagetitle =
    locale === "en"
      ? data.titleen
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}${seoTitleSuffix}`.trim();

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

  // OGP画像: 生成済みの /ogp/{titleen}.jpg を優先し、
  // ローカルサムネが存在しない絵巻は Cloudinary 変換URLを使用
  const ogImage =
    OGP_IMAGE_FALLBACKS[data.titleen] || `/ogp/${encodeURI(data.titleen)}.jpg`;

  const jsonLd = buildEmakiJsonLd({
    locale,
    slug,
    defaultLocale,
    name: pagetitle,
    description: pageDescTemp,
    image: ogImage,
    creatorName: pageAuthor,
    siteTitle: t.siteTitle,
    typeName: locale === "en" ? data.typeen : data.type,
    typeSlug: data.typeen,
  });

  // 教育現場向けUI: 巻末ナッジ用 - 兄弟巻は EmakiLandscapContent 内で取得
  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);

  const breadcrumbProps = isKusouzu
    ? {
        nameHub: tc("kusouzuHub.breadcrumb"),
        nameHubPath: "kusouzu/chapters-kusouzu",
        nameB: locale === "en" ? data.titleen : data.title,
      }
    : isChojuGiga
    ? {
        nameHub: tc("choujuGigaHub.breadcrumb"),
        nameHubPath: "chouju-giga/chapters",
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
          {!full && <EmakiHeader />}
          {!full && <EmakiBreadcrumbs orientation={orientation} {...breadcrumbProps} />}
          <EmakiPortraitContent
            data={data}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            viewerFullscreen={full}
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
        pageImg={ogImage}
        pageImgW={1200}
        pageImgH={630}
        pageType={data.type}
        jsonLd={jsonLd}
      />
      <ClassicalFontLink />
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
  const tEmakisData = emakisData;
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
      data: metaFromList
        ? {
            ...addObjEmakis,
            ...metaFromList,
            emakis: addObjEmakis.emakis,
          }
        : addObjEmakis,
      locales,
      locale,
      slug: slug,
      test: addObjEmakis,
    },
  };
};

export default Emaki;
