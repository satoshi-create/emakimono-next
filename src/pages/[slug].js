import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import Head from "@/components/meta/Meta";
import MiddleNavigation from "@/components/navigation/MiddleNavigation";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
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
  const paths = emakisData.map((item) => ({
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

  const { slug } = context.params;
  const { locale, locales } = context;

  // 旧 image-metadata-cache からページメタデータのみ取得
  const cacheDir = path.join(process.cwd(), "src/data/image-metadata-cache");
  const cacheFilePath = path.join(cacheDir, "image-metadata-cache.json");
  if (!fs.existsSync(cacheFilePath)) {
    throw new Error(
      "Image metadata cache not found. Run the generateImageMetadata script."
    );
  }
  const metadataCache = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

  const baseMeta = metadataCache.find((item) => item.titleen === slug);

  if (!baseMeta) {
    return {
      notFound: true,
    };
  }

  // 新スキーマ（viewer）JSON を読み込み
  const viewerDir = path.join(process.cwd(), "src/data/viewer");

  // 一時的に固定: 絵巻画像が正常に描画されるよう viewer データを choju-giga-yamazaki-kou.json から直接読み込む
  const scrollId = "choju-giga-yamazaki-kou";

  const viewerFilePath = path.join(viewerDir, `${scrollId}.json`);

  if (!fs.existsSync(viewerFilePath)) {
    throw new Error(`Viewer JSON not found for scroll_id: ${scrollId}`);
  }

  const viewerData = JSON.parse(fs.readFileSync(viewerFilePath, "utf-8"));

  // sort_key による物語順を保証（生成側で保証されている場合でも安全のため一度だけソート）
  const sortedEmakis = Array.isArray(viewerData.emakis)
    ? [...viewerData.emakis].sort((a, b) => a.sort_key - b.sort_key)
    : [];

  const data = {
    // 既存コンポーネントが利用しているメタ情報は旧キャッシュから維持
    ...baseMeta,
    // 新スキーマのメタデータもマージ（description など）
    ...(viewerData.metadata || {}),
    // 計測ロジック互換用の id
    id: baseMeta.id,
    // 既存フィールド互換
    title: baseMeta.title,
    titleen: baseMeta.titleen,
    author: baseMeta.author,
    authoren: baseMeta.authoren,
    desc: baseMeta.desc,
    descen: baseMeta.descen,
    // 新スキーマの emakis（sort_key 順）をそのまま渡す
    emakis: sortedEmakis,
  };

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      data,
      locales,
      locale,
      slug: slug,
    },
    // ISR: 60秒ごとにバックグラウンド再生成
    revalidate: 60,
  };
};

export default Emaki;
