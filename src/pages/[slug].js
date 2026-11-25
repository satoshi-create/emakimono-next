import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import ClassicalFontLink from "@/components/meta/ClassicalFontLink";
import Head from "@/components/meta/Meta";
import emakisData from "@/data/scroll-metadata";
import referencesData from "@/data/master/references.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { OGP_IMAGE_FALLBACKS } from "@/libs/constants/emakiOgImages";
import { AppContext } from "@/context/AppContext";
import { SceneLikeCountsProvider } from "@/context/SceneLikeCountsContext";
import { connectGenjiChapterFallback } from "@/utils/connectEmakiText";
import { buildEmakiJsonLd } from "@/utils/buildEmakiJsonLd";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { buildI18nStaticPaths } from "@/utils/i18nStaticPaths";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { isHyakkiClusterScroll } from "@/utils/buildHyakkiHubData";
import { isRakuchuRakugaiClusterScroll } from "@/utils/buildRakuchuRakugaiHubData";
import { emakiDisplayTitle, getLocalizedField } from "@/utils/emakiDisplayTitle";
import { getFolkloreItemById } from "@/data/folklore/folkloreIndex";
import { useLocaleMeta } from "@/utils/func";
import { resolveLinkIdByChapter } from "@/utils/resolveQuizJump";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef } from "react";
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
    // ?scene / ?ebiki ディープリンクも先頭リセットしない（#1 フォールバック防止）
    window.scrollTo({ top: 0, behavior: "instant" });
    const params = new URLSearchParams(window.location.search || "");
    if (
      params.has("ebiki") ||
      params.has("scene") ||
      params.has("chapter") ||
      params.has("spot")
    )
      return;
    const hashScene = Number(
      String(window.location.hash || "").replace("#", "")
    );
    if (!hashScene) {
      setnavIndex(0);
      setHash(0);
    }
  }, [slug, setnavIndex, setHash]);

  // ebiki / scene / chapter の初期位置解決は EmakiConteiner 側のマウント時 handleToId に集約。
  // クエリが存在する場合は EmakiConteiner 側の着地処理に委ね、ここでの setnavIndex 競合を防ぐ。
  useEffect(() => {
    const targetChapter = router.query?.scene ?? router.query?.chapter;
    if (
      router.query?.ebiki ||
      targetChapter !== undefined ||
      router.query?.spot
    ) {
      return;
    }
  }, [
    router.query?.scene,
    router.query?.chapter,
    router.query?.ebiki,
    router.query?.spot,
    data,
    setnavIndex,
  ]);

  const emaki = useMemo(
    () =>
      data
        ? {
            ...data,
            slug: data.slug ?? data.titleen,
            id: data.id ?? data.titleen,
          }
        : null,
    [data]
  );

  if (!data) {
    return null;
  }

  const isJa = locale === "ja";

  // 九相図クラスタ SEO: 代表巻・檀林皇后版は SERP 向け title/desc を個別最適化。
  // H1（data.title）は変えない。
  let pagetitle;
  if (data.titleen === "kusouzumaki") {
    pagetitle =
      !isJa
        ? "Kusōzu-maki (Nine Stages of Decay) — Scene List & Interactive Scroll"
        : "九相図巻｜九相図とは・一覧・順番を横スクロールで鑑賞";
  } else if (data.titleen === "nine-stages-of-decay-empress-danrin") {
    pagetitle =
      !isJa
        ? "Nine Stages of Decay of Empress Danrin — Interactive High-Res Emakimono Scroll"
        : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();
  } else {
    pagetitle =
      !isJa
        ? emakiDisplayTitle(data, locale)
        : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();
  }

  const pageAuthor = getLocalizedField(data, "author", locale);

  const tPageDesc =
    !isJa
      ? `You can enjoy all the scenes of the ${pagetitle} ${
          pageAuthor && `（${pageAuthor}）`
        }in vertical and right to left scrolling mode.`
      : `${pagetitle}${
          pageAuthor && `（${pageAuthor}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const pageDesc = getLocalizedField(data, "desc", locale);

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
    !isJa
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
    typeName: getLocalizedField(data, "type", locale),
    typeSlug: data.typeen,
  });

  // 教育現場向けUI: 巻末ナッジ用 - 兄弟巻は EmakiLandscapContent 内で取得
  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);
  const isHyakki = isHyakkiClusterScroll(data);
  const isRakuchuRakugai = isRakuchuRakugaiClusterScroll(data);

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
    : isHyakki
    ? {
        nameHub: tc("hyakkiHub.breadcrumb"),
        nameHubPath: "hyakki/chapters",
        nameB: displayTitle,
      }
    : isRakuchuRakugai
    ? {
        nameHub: tc("rakuchuRakugaiHub.breadcrumb"),
        nameHubPath: "rakuchu-rakugai/chapters",
        nameB: displayTitle,
      }
    : {
        nameA: getLocalizedField(data, "type", locale),
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
            data={emaki}
            emaki={emaki}
            locale={locale}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            viewerFullscreen={full}
            showHyakkiHubLink={isHyakki}
            showRakuchuRakugaiHubLink={isRakuchuRakugai}
          />
        </>
      );
    } else if (ori === "portrait") {
      return (
        <>
          {!full && <EmakiHeader />}
          {!full && <EmakiBreadcrumbs orientation={orientation} {...breadcrumbProps} />}
          <EmakiPortraitContent
            data={emaki}
            emaki={emaki}
            locale={locale}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            viewerFullscreen={full}
            showHyakkiHubLink={isHyakki}
            showRakuchuRakugaiHubLink={isRakuchuRakugai}
          />
        </>
      );
    }
  };

  const handleDevDeleteScroll = async () => {
    if (!data?.titleen) return;
    const label = data.title || data.titleen;
    const confirmed = window.confirm(
      `開発環境: 「${label}」（${data.titleen}）のローカルJSON・画像・サムネイルを削除しますか？`
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/dev/delete-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleen: data.titleen }),
      });
      const payload = await res.json();
      if (res.ok && payload.ok) {
        window.location.href = "/";
        return;
      }
      alert(payload?.error || payload?.message || "削除に失敗しました");
    } catch (err) {
      alert(err?.message || "削除に失敗しました");
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
      {process.env.NODE_ENV === "development" && data?.titleen ? (
        <button
          type="button"
          onClick={handleDevDeleteScroll}
          aria-label="開発用: 作品削除"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: "8px 12px",
            fontSize: "12px",
            cursor: "pointer",
            background: "#fff",
            border: "1px solid #c62828",
            color: "#c62828",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          開発用: 作品削除 🗑
        </button>
      ) : null}
    </>
  );
};

// 詞書がない段（絵単独の段）でも、帖番号（genji_chapter）があれば
// genji-chapters.json の「あらすじ/現代文/古文」をテキスト表示へバインドする。
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

export const getStaticPaths = async (context) => {
  const activeSlugs = emakisData
    .filter((item) => !isWithdrawnScroll(item.titleen))
    .map((item) => item.titleen);
  const paths = buildI18nStaticPaths(activeSlugs, context?.locales);
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { loadEmakiMetadataFresh } = require("@/data/scroll-metadata/loadFresh");
  const metadataCache = loadEmakiMetadataFresh();

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

  const currentData = metaFromList
    ? {
        ...addObjEmakis,
        ...metaFromList,
        emakis: addObjEmakis.emakis,
      }
    : addObjEmakis;

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data: {
        ...currentData,
        reference: referencesData[slug] || currentData.reference || [],
      },
      locales,
      locale,
      slug: slug,
    },
  };
};

export default Emaki;
