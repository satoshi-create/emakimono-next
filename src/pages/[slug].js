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
import { SceneLikeCountsProvider } from "@/context/SceneLikeCountsContext";
import { connectGenjiChapterFallback } from "@/utils/connectEmakiText";
import { buildEmakiJsonLd } from "@/utils/buildEmakiJsonLd";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

const Emaki = ({ data, locale, locales, slug }) => {
  const { t } = useLocaleMeta();
  const { t: tc } = useTranslation("common");
  const router = useRouter();
  const { defaultLocale } = router;
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
    // 別絵巻へ遷移した際に、縦スクロール・navIndex をリセット
    // hash 付き共有リンク入場では navIndex を消さない（handleToId と競合して先頭に戻る）
    window.scrollTo({ top: 0, behavior: "instant" });
    const hashScene = Number(
      String(window.location.hash || "").replace("#", "")
    );
    if (!hashScene) {
      setnavIndex(0);
      setHash(0);
    }
  }, [slug, setnavIndex, setHash]);

  // 逆引きクエリ `?scene={sceneId}`（/genji/[slug] の「この段を絵巻で観る」）:
  // マウント後、該当段（emakis[].chapter = scene id）の linkId へスクロール位置を合わせる。
  // ハッシュ共有リンク（#linkId）と同じく navIndex 経由で段送りする。
  useEffect(() => {
    const sceneParam = router.query?.scene;
    if (!sceneParam || !data?.emakis) return;
    const key = String(
      Array.isArray(sceneParam) ? sceneParam[0] : sceneParam
    ).trim();
    if (!key) return;
    const target =
      data.emakis.find((item) => String(item.chapter ?? "") === key) ??
      (/^\d+$/.test(key) ? data.emakis[Number(key)] : undefined);
    if (!target || typeof target.linkId !== "number") return;
    setnavIndex(target.linkId);
  }, [router.query?.scene, data, setnavIndex]);

  if (!data) {
    return null;
  }

  // 九相図クラスタ SEO: 代表巻・檀林皇后版は SERP 向け title/desc を個別最適化。
  // H1（data.title）は変えない。
  let pagetitle;
  if (data.titleen === "kusouzumaki") {
    pagetitle =
      locale === "en"
        ? "Kusōzu-maki (Nine Stages of Decay) — Scene List & Interactive Scroll"
        : "九相図巻｜九相図とは・一覧・順番を横スクロールで鑑賞";
  } else if (data.titleen === "nine-stages-of-decay-empress-danrin") {
    pagetitle =
      locale === "en"
        ? "Nine Stages of Decay of Empress Danrin — Interactive High-Res Emakimono Scroll"
        : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();
  } else {
    pagetitle =
      locale === "en"
        ? emakiDisplayTitle(data, locale)
        : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();
  }

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

  let pageDescTemp = pageDesc ? pageDesc : tPageDesc;
  if (data.titleen === "kusouzumaki") {
    if (locale === "ja") {
      pageDescTemp =
        "九相図（くそうず）とは何か、全場面の一覧と変遷の順番を、鎌倉時代の代表作「九相図巻」で横スクロール鑑賞。生前相から灰相まで高精細ビューアーで辿れます。";
    } else if (!pageDescTemp?.toLowerCase().includes("nine stages")) {
      pageDescTemp = `What is kusōzu (Nine Stages of Decay)? Explore the full scene list in order on the Kamakura-period Kusōzu-maki — high-resolution horizontal scrolling. ${
        pageDescTemp || ""
      }`.trim();
    }
  } else if (
    data.titleen === "nine-stages-of-decay-empress-danrin" &&
    locale === "en"
  ) {
    pageDescTemp =
      "Nine Stages of Decay (9 stages of decay) of Empress Danrin — an interactive high-res emakimono scroll from the Honolulu Museum of Art. Unroll every surviving stage right to left.";
  }

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

  const displayTitle = emakiDisplayTitle(data, locale);
  const breadcrumbProps = isKusouzu
    ? {
        nameHub: tc("kusouzuHub.breadcrumb"),
        nameHubPath: "kusouzu/chapters-kusouzu",
        nameB: displayTitle,
      }
    : isChojuGiga
    ? {
        nameHub: tc("choujuGigaHub.breadcrumb"),
        nameHubPath: "chouju-giga/chapters",
        nameB: displayTitle,
      }
    : {
        nameA: locale === "en" ? data.typeen : data.type,
        nameAen: `type/${data.typeen}`,
        nameB: displayTitle,
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
      <SceneLikeCountsProvider emakiId={data.titleen}>
        {matchMediaContainer(toggleFullscreen, orientation)}
      </SceneLikeCountsProvider>
    </>
  );
};

// 詞書がない段（絵単独の段）でも、帖番号（genji_chapter）があれば
// chapters-of-genji.json の「あらすじ/現代文/古文」をテキスト表示へバインドする。
// 巻別 JSON に既値がある場合はそちらを優先し、該当帖が無ければ元の item をそのまま返す。
const withGenjiChapterText = (item) => {
  if (!item.genji_chapter) return item;
  const fallback = connectGenjiChapterFallback(item.genji_chapter);
  if (!fallback) return item;
  return {
    ...item,
    desc: item.desc || fallback.summary,
    descen: item.descen || fallback.summaryen,
    gendaibun: item.gendaibun || fallback.gendaibun,
    gendaibunen: item.gendaibunen || fallback.gendaibunen,
    kobun: item.kobun || fallback.kobun,
    kobunen: item.kobunen || fallback.kobunen,
  };
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

      return { ...item, emakis: sortConcatFilterAddObjEmakis.map(withGenjiChapterText) };
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
    },
  };
};

export default Emaki;
