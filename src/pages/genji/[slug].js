import { useState } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import AllGenjiChapters from "@/data/scroll-texts/genji-chapters.json";
import styles from "@/styles/GenjiHub.module.css";
import { removeNestedEmakisObj } from "@/utils/func";
import { genjiChapterHref } from "@/utils/buildGenjiHubData";
import {
  buildI18nStaticPaths,
  resolveEmakiCatalog,
} from "@/utils/i18nStaticPaths";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
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
  sourceKobunUrl,
  sourceGendaibunUrl,
  posts,
}) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const [activeTab, setActiveTab] = useState("summary");

  const chapterTexts = {
    title,
    titleen,
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
  };

  const tabDefs = [
    {
      id: "summary",
      label: !isJa ? "Summary" : "あらすじ",
      body: getLocalizedField(chapterTexts, "summary", locale),
    },
    {
      id: "gendaibun",
      label: !isJa ? "Modern Japanese" : "現代文",
      body: getLocalizedField(chapterTexts, "gendaibun", locale),
      source: sourceGendaibunUrl,
    },
    {
      id: "kobun",
      label: !isJa ? "Classical Japanese" : "古文",
      body: getLocalizedField(chapterTexts, "kobun", locale),
      source: sourceKobunUrl,
    },
  ];
  const availableTabs = tabDefs.filter((tab) => Boolean(tab.body));
  const currentTab =
    availableTabs.find((tab) => tab.id === activeTab) ?? availableTabs[0];

  const relatedScrolls = posts ?? [];

  const tPageDesc = !isJa
    ? `View the "${titleen}" chapter of The Tale of Genji and the illustrated scrolls that depict it.`
    : `源氏物語「${title}」帖のあらすじと、この帖を描いた絵巻を横スクロールで鑑賞できます。`;

  return (
    <>
      <Head
        pagetitle={
          !isJa
            ? `"${titleen}" from The Tale of Genji`
            : `源氏物語「${title}」`
        }
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={getLocalizedField(chapterTexts, "title", locale)}
      />
      <section className={styles.chapterDetail}>
        <div className={styles.chapterDetailHead}>
          <h1 className={styles.chapterDetailTitle}>
            {getLocalizedField(chapterTexts, "title", locale)}
          </h1>
          <span className={styles.chapterDetailRuby}>{ruby}</span>
          <div className={styles.chapterDetailFacts}>
            <span>
              {!isJa ? "Chapter" : "帖"}:{" "}
              <span className={styles.chapterDetailFactValue}>
                {!isJa ? chapterEn : chapterCh}
              </span>
            </span>
            {age && (
              <span>
                {!isJa ? "Age" : "巻立"}:{" "}
                <span className={styles.chapterDetailFactValue}>
                  {getLocalizedField(chapterTexts, "age", locale)}
                </span>
              </span>
            )}
            {mainCharacter && (
              <span>
                {!isJa ? "Main character" : "主な人物"}:{" "}
                <span className={styles.chapterDetailFactValue}>
                  {getLocalizedField(chapterTexts, "mainCharacter", locale)}
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
            {currentTab.source && (
              <a
                className={styles.sourceLink}
                href={currentTab.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {currentTab.id === "kobun"
                  ? !isJa
                    ? "Open the classical text (source) ↗"
                    : "出典・底本（古文）を開く ↗"
                  : !isJa
                  ? "Open the modern translation (source) ↗"
                  : "出典・底本（現代文）を開く ↗"}
              </a>
            )}
          </div>
        )}
        {sourceUrl && (
          <a
            className={styles.sourceLink}
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {!isJa ? "Source" : "出典"}
          </a>
        )}
      </section>
      {(scenes ?? []).length > 0 && (
        <section className={styles.chapterDetail}>
          <h2 className={styles.sectionTitle}>
            {!isJa ? "Scenes" : "場面"}
          </h2>
          <ol className={styles.sceneList}>
            {scenes.map((scene) => (
              <li key={scene.sceneId} className={styles.sceneItem}>
                <span className={styles.sceneIndex}>{scene.sceneId}</span>
                <span>
                  {getLocalizedField(scene, "content", locale)}
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
              !isJa
                ? `Illustrated scrolls depicting "${titleen}"`
                : `源氏物語「${title}」を描いた絵巻`
            }
            sectiontitleen={
              !isJa
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

export const getStaticPaths = async (context) => {
  const slugs = AllGenjiChapters.map(({ path }) => path);
  const paths = buildI18nStaticPaths(slugs, context?.locales);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const genjieslugname = context.params.slug;
  const { locale } = context;
  const tEmakisData = resolveEmakiCatalog(locale);

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
    const viewerHref = genjiChapterHref(item, chapterGenji.chapter_en);
    return { ...removeNestedEmakisObj(item), viewerHref };
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
      // 古文は 404 回避のため渋谷栄一校訂版（Wikisource）へ一律固定
      sourceKobunUrl:
        "https://ja.wikisource.org/wiki/%E6%BA%90%E6%B0%8F%E7%89%A9%E8%AA%9E_(%E6%B8%8B%E8%B0%B7%E6%A0%84%E4%B8%80%E6%A0%A1%E8%A8%82)",
      sourceGendaibunUrl: chapterGenji.source_gendaibun_url || null,
      posts: removeNestedArrayObj,
    },
  };
};

export default GenjiChapter;
