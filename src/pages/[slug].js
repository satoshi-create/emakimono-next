import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import Head from "@/components/meta/Meta";
import MiddleNavigation from "@/components/navigation/MiddleNavigation";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { getEmakiDetail, getScrollData, getScrollMetadataById } from "@/libs/api/scrollService";
import { AppContext } from "@/pages/_app";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

const Emaki = ({ data, locale, locales, slug, test }) => {
  const { t } = useLocaleMeta();
  const router = useRouter();
  const selectedRef = useRef(null);
  const {
    navIndex,
    setnavIndex,
    setHash,
    orientation,
    toggleFullscreen,
    setToggleFullscreen,
  } = useContext(AppContext);

  const pagetitle =
    locale === "en"
      ? data.titleen
      : `${data.title} ${data.edition ? data.edition : ""}`;

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

  const jsonData = {
    "@context": "http://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${locale}/emakimono.com/${slug}`,
    },
    headline: pagetitle,
    description: tPageDesc,
    url: `https://${locale}/emakimono.com/${slug}`,
    image: {
      "@type": "ImageObject",
      url: data.thumb,
      width: "533px",
      height: "300px",
    },
    author: {
      "@type": "Person",
      name: "横スクロールで楽しむ絵巻",
      url: "https://portfoliosite-next.vercel.app/",
    },
    publisher: {
      "@type": "Organization",
      name: "横スクロールで楽しむ絵巻",
      logo: {
        "@type": "ImageObject",
        url: "/favicon.png",
      },
      breadcrumbList: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "横スクロールで楽しむ絵巻",
            item: "https://emakimono.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: data.type,
            item: `https://emakimono.com/type/${data.typeen}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: data.title,
          },
        ],
      },
    },
  };
  const jsonLd = JSON.stringify(jsonData, null, " ");

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
    // 画面遷移した際に、スクロール位置をリセット
    window.scrollTo({ top: 0, behavior: "instant" });
    setnavIndex(0);
    setHash(0);
  }, [setnavIndex, setHash]);

  const matchMediaContainer = (full, ori) => {
    if (full && ori === "landscape") {
      return (
        <>
          <EmakiConteiner
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            height={"var(--vh-100)"}
          />
        </>
      );
    } else if (ori === "landscape") {
      return (
        <>
          <EmakiHeader />
          <EmakiBreadcrumbs
            nameA={locale === "en" ? data.typeen : data.type}
            nameAen={`type/${data.typeen}`}
            nameB={locale === "en" ? data.titleen : data.title}
          />
          <EmakiLandscapContent
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
          />
        </>
      );
    } else if (ori === "portrait") {
      return (
        <>
          <EmakiHeader />
          <EmakiBreadcrumbs
            orientation={orientation}
            nameA={locale === "en" ? data.typeen : data.type}
            nameAen={`type/${data.typeen}`}
            nameB={locale === "en" ? data.titleen : data.title}
          />
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
  try {
    const { getScrollList } = await import("@/libs/api/scrollService");
    const scrollList = await getScrollList();
    if (scrollList.length > 0) {
      const paths = scrollList.map((item) => ({
        params: { slug: item.scroll_id },
        locale: "ja",
      }));
      const pathsEn = paths.map((p) => ({ ...p, locale: "en" }));
      return { paths: [...paths, ...pathsEn], fallback: false };
    }
  } catch (e) {
    console.warn("getStaticPaths: getScrollList failed, using cache", e?.message);
  }
  const paths = emakisData.map((item) => ({
    params: { slug: item.titleen },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { slug } = context.params;
  const { locale, locales } = context;

  console.log("[slug] getStaticProps 開始 params.slug:", JSON.stringify(slug), "| type:", typeof slug);

  const metadataCache = require("@/data/image-metadata-cache/image-metadata-cache.json");

  // 1) slug がキャッシュの titleen（旧URL）の場合は baseMeta から scroll_id を解決
  let baseMeta = metadataCache.find((item) => item.titleen === slug);
  let scrollId = null;

  if (baseMeta) {
    console.log("[slug] slug が titleen でヒット baseMeta.id:", baseMeta.id);
    const scrollMeta = await getScrollMetadataById(baseMeta.id);
    scrollId = scrollMeta?.metadata?.scroll_id ?? null;
  } else {
    scrollId = slug;
  }

  console.log("[slug] 解決後の scrollId:", JSON.stringify(scrollId));

  if (!scrollId) {
    console.error("[slug] scrollId が null のため notFound");
    return { notFound: true };
  }

  const viewerData = await getEmakiDetail(scrollId);
  console.log("[slug] getStaticProps viewerData:", viewerData ? { emakisCount: viewerData.emakis?.length, hasMetadata: !!viewerData.metadata } : null);

  if (!viewerData || !viewerData.emakis || viewerData.emakis.length === 0) {
    console.error("[slug] viewerData 不足のため notFound:", {
      hasViewerData: !!viewerData,
      emakisLength: viewerData?.emakis?.length ?? 0,
    });
    return { notFound: true };
  }

  if (baseMeta) {
    const metaFromViewer = viewerData.metadata || {};
    const data = {
      ...baseMeta,
      ...metaFromViewer,
      id: baseMeta.id,
      title: baseMeta.title,
      titleen: baseMeta.titleen ?? scrollId,
      author: baseMeta.author,
      authoren: baseMeta.authoren ?? baseMeta.author,
      type: baseMeta.type,
      typeen: baseMeta.typeen ?? baseMeta.type,
      desc: metaFromViewer.description ?? baseMeta.desc,
      descen: metaFromViewer.description_en ?? baseMeta.descen,
      description: metaFromViewer.description ?? baseMeta.desc,
      description_en: metaFromViewer.description_en ?? baseMeta.descen,
      emakis: viewerData.emakis,
    };
    return {
      props: {
        ...(await serverSideTranslations(locale, ["common"])),
        data,
        locales,
        locale,
        slug: slug,
      },
      revalidate: 60,
    };
  }

  const scrollMeta = await getScrollData(scrollId);
  const meta = scrollMeta?.metadata;
  if (!meta) {
    console.error("[slug] getScrollData の meta が取得できないため notFound:", {
      scrollId,
      hasScrollMeta: !!scrollMeta,
      hasMetadata: !!scrollMeta?.metadata,
    });
    return { notFound: true };
  }

  const data = {
    id: meta.id,
    title: meta.title,
    titleen: meta.scroll_id ?? scrollId,
    author: meta.author ?? "",
    authoren: meta.authoren ?? meta.author ?? "",
    type: meta.type ?? "絵巻",
    typeen: meta.typeen ?? "emaki",
    era: meta.era ?? "",
    eraen: meta.eraen ?? meta.era ?? "",
    desc: meta.description ?? "",
    descen: meta.description_en ?? meta.description ?? "",
    description: meta.description ?? "",
    description_en: meta.description_en ?? "",
    thumb: meta.thumbnail ?? "",
    sourceImageUrl: meta.source?.url ?? "#",
    sourceImage: meta.source?.name ?? "",
    reference: [],
    edition: "",
    emakis: viewerData.emakis,
    ...(viewerData.metadata || {}),
  };

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data,
      locales,
      locale,
      slug: slug,
    },
    revalidate: 60,
  };
};

export default Emaki;
