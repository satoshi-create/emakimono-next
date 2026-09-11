import { useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import AllGenjiChapters from "@/data/emaki-text-data/chapters-of-genji.json";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import styles from "@/styles/GenjiHub.module.css";
import { removeNestedEmakisObj } from "@/utils/func";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const GenjiChapter = ({
  title,
  titleen,
  ruby,
  chapterCh,
  chapterEn,
  summary,
  summaryen,
  gendaibun,
  gendaibunen,
  kobun,
  kobunen,
  age,
  ageen,
  mainCharacter,
  mainCharacteren,
  scenes = [],
  sourceUrl,
  posts,
}) => {
  const { locale } = useRouter();
  const isEn = locale === "en";
  const [activeTab, setActiveTab] = useState("summary");

  const tabDefs = [
    {
      id: "summary",
      label: isEn ? "Summary" : "あらすじ",
      body: isEn ? summaryen || summary : summary,
    },
    {
      id: "gendaibun",
      label: isEn ? "Modern Japanese" : "現代文",
      body: isEn ? gendaibunen || gendaibun : gendaibun,
    },
    {
      id: "kobun",
      label: isEn ? "Classical Japanese" : "古文",
      body: isEn ? kobunen || kobun : kobun,
    },
  ];
  const availableTabs = tabDefs.filter((tab) => Boolean(tab.body));
  const currentTab =
    availableTabs.find((tab) => tab.id === activeTab) ?? availableTabs[0];

  const relatedScrolls = posts ?? [];

  const tPageDesc = isEn
    ? `View the "${titleen}" chapter of The Tale of Genji and the illustrated scrolls that depict it.`
    : `源氏物語「${title}」帖のあらすじと、この帖を描いた絵巻を横スクロールで鑑賞できます。`;

  return (
    <>
      <Head
        pagetitle={
          isEn
            ? `"${titleen}" from The Tale of Genji`
            : `源氏物語「${title}」`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={isEn ? titleen : title}
        test={isEn ? "The Tale of Genji — 54 chapters" : "源氏物語 五十四帖"}
        testen={"genji/chapters-genji"}
      />
      <section className={styles.chapterDetail}>
        <div className={styles.chapterDetailHead}>
          <h1 className={styles.chapterDetailTitle}>
            {isEn ? titleen : title}
          </h1>
          <span className={styles.chapterDetailRuby}>{ruby}</span>
          <div className={styles.chapterDetailFacts}>
            <span>
              {isEn ? "Chapter" : "帖"}:{" "}
              <span className={styles.chapterDetailFactValue}>
                {isEn ? chapterEn : chapterCh}
              </span>
            </span>
            {age && (
              <span>
                {isEn ? "Age" : "巻立"}:{" "}
                <span className={styles.chapterDetailFactValue}>
                  {isEn ? ageen || age : age}
                </span>
              </span>
            )}
            {mainCharacter && (
              <span>
                {isEn ? "Main character" : "主な人物"}:{" "}
                <span className={styles.chapterDetailFactValue}>
                  {isEn ? mainCharacteren || mainCharacter : mainCharacter}
                </span>
              </span>
            )}
          </div>
        </div>
        {currentTab && (
          <div className={styles.chapterTabWrap}>
            <div className={styles.chapterTabs} role="tablist">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={currentTab.id === tab.id}
                  className={`${styles.chapterTab} ${
                    currentTab.id === tab.id ? styles.chapterTabActive : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className={styles.chapterDetailSummary}>{currentTab.body}</p>
          </div>
        )}
        {sourceUrl && (
          <a
            className={styles.sourceLink}
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isEn ? "Source" : "出典"}
          </a>
        )}
      </section>
      {(scenes ?? []).length > 0 && (
        <section className={styles.chapterDetail}>
          <h2 className={styles.sectionTitle}>
            {isEn ? "Scenes" : "場面"}
          </h2>
          <ol className={styles.sceneList}>
            {scenes.map((scene) => (
              <li key={scene.sceneId} className={styles.sceneItem}>
                <span className={styles.sceneIndex}>{scene.sceneId}</span>
                <span>
                  {isEn ? scene.contenten || scene.content : scene.content}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {relatedScrolls.length > 0 && (
        <section className={styles.relatedScrollsSection}>
          <CardA
            emakis={relatedScrolls}
            columns={"three"}
            sectionname={"recommend"}
            pagetitle={title}
            sectiontitle={
              isEn
                ? `Illustrated scrolls depicting "${titleen}"`
                : `源氏物語「${title}」を描いた絵巻`
            }
            sectiontitleen={
              isEn
                ? `源氏物語「${title}」を描いた絵巻`
                : `Illustrated scrolls depicting "${titleen}"`
            }
          />
        </section>
      )}
      <Footer />
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = AllGenjiChapters.map(({ path }) => ({
    params: {
      slug: path,
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
  const genjieslugname = context.params.slug;
  const { locale } = context;
  const tEmakisData = locale === "en" ? enData : jaData;

  const chapterGenji = AllGenjiChapters.find(
    (item) => item.path === genjieslugname
  );

  if (!chapterGenji) {
    return { notFound: true };
  }

  const filterdEmakisData = tEmakisData.filter((item) =>
    item.genjieslug?.some(
      (y) =>
        y.path === chapterGenji.path || y.id === chapterGenji.chapter_en
    )
  );

  const removeNestedArrayObj = filterdEmakisData.map((item) => {
    return removeNestedEmakisObj(item);
  });

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      title: chapterGenji.title || null,
      titleen: chapterGenji.titleen || null,
      ruby: chapterGenji.ruby || null,
      chapterCh: chapterGenji.chapter_ch || null,
      chapterEn: chapterGenji.chapter_en || null,
      summary: chapterGenji.summary || null,
      summaryen: chapterGenji.summaryen || null,
      gendaibun:
        chapterGenji.gendaibun ||
        chapterGenji.modern ||
        chapterGenji.excerpt ||
        null,
      gendaibunen: chapterGenji.gendaibunen || null,
      kobun: chapterGenji.kobun || chapterGenji.classical || null,
      kobunen: chapterGenji.kobunen || null,
      age: chapterGenji.age || null,
      ageen: chapterGenji.ageen || null,
      mainCharacter: chapterGenji["main-character"] || null,
      mainCharacteren:
        chapterGenji.mainCharacteren ||
        chapterGenji["main-character-en"] ||
        null,
      scenes: chapterGenji.scene || [],
      sourceUrl: chapterGenji.url || chapterGenji.source || null,
      posts: removeNestedArrayObj,
    },
  };
};

export default GenjiChapter;
