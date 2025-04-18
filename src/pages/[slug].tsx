import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiHeader from "@/components/emaki/layout/EmakiHeader";
import EmakiLandscapContent from "@/components/emaki/layout/EmakiLandscapContent";
import EmakiPortraitContent from "@/components/emaki/layout/EmakiPortraitContent";
import EmakiBreadcrumbs from "@/components/emaki/navigation/EmakiBreadcrumbs";
import Head from "@/components/meta/Meta";
import MiddleNavigation from "@/components/navigation/MiddleNavigation";
import { default as enData, default as jaData } from "@/data/data";
import { AppContext } from "@/pages/_app";
import { useLocaleMeta } from "@/utils/func";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef } from "react";
import type { EmakiImageMetadata } from '@/types/metadata'; // Import the main type
import fs from "fs";
import path from "path";
import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext  } from 'next';

// TODO:スマホ版横向きのページにタイトルと絵師名を追加する

interface EmakiPageProps {
  data: EmakiImageMetadata;
  locale: string;
  locales: string[];
  slug: string;
  test: EmakiImageMetadata;
}

const Emaki = ({ data, locale, locales, slug, test }: EmakiPageProps) => {
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
            height={"100vh"}
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

export const getStaticPaths: GetStaticPaths = async () => {
  const cacheDir = path.join(process.cwd(), "src/data/image-metadata-cache");
  const cacheFilePath = path.join(cacheDir, "image-metadata-cache.json");

  // Type the data read from the cache
  const metadataCache: EmakiImageMetadata[] = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

  const paths = metadataCache.map((item) => ({
    params: {
      slug: item.titleen,
    },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<EmakiPageProps, { slug: string }> = async (context: GetStaticPropsContext<{ slug: string }>) => {
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

  return {
    props: {
      data: addObjEmakis,
      locales,
      locale,
      slug: slug,
      test: addObjEmakis,
    },
  };
};

export default Emaki;
