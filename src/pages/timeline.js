import EmakiTimeline from "@/components/chronology/EmakiTimeline";
import EmakiTimelineSimple from "@/components/chronology/EmakiTimelineSimple";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Title from "@/components/ui/Title";
import {
  en as enTimeline,
  ja as jaTimeline,
} from "@/data/chronology/emakiTimeline";
import {
  en as enTimelineSimple,
  ja as jaTimelineSimple,
} from "@/data/chronology/emakiTimelineSimple";
import { buildTimelineJsonLd } from "@/utils/buildTimelineJsonLd";
import { getLiveSlugs } from "@/utils/getLiveSlugs";
import { useLocaleMeta } from "@/utils/func";
import styles from "@/styles/EmakiTimeline.module.css";
import { useMediaQuery } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Timeline = ({ rows, simpleRows, liveSlugs }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  // モバイルでは「さくっと見る」を初期表示。デスクトップは自動で「詳細年表」に切替。
  // ユーザーが手動で切替えたら自動切替は止める（SSR のハイドレーションずれも回避）。
  const [viewMode, setViewMode] = useState("simple");
  const [userTouched, setUserTouched] = useState(false);
  const [isDesktop] = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!userTouched && isDesktop) {
      setViewMode("full");
    }
  }, [isDesktop, userTouched]);

  // 絵巻ページ/時代ページからのアンカーリンク（#simple-{eraen} = 簡易版, #eraen = 詳細版）
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    if (hash.startsWith("#simple-")) {
      setViewMode("simple");
    } else if (/^#(heiann|kamakura|muromachi|aduchimomoyama|edo|meiji)$/.test(hash)) {
      setViewMode("full");
    }
    // デスクトップの自動切替に上書きされないよう、明示指定扱いにする
    setUserTouched(true);
  }, []);

  // 表示切替後にアンカー先へスクロール
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [viewMode]);

  const switchMode = (mode) => {
    setUserTouched(true);
    setViewMode(mode);
  };

  const jsonLd = buildTimelineJsonLd({
    locale,
    defaultLocale,
    pageName: t("timeline.pagetitle"),
    pageDescription: t("timeline.metaDesc"),
    siteTitle: meta.siteTitle,
    rows,
  });

  return (
    <>
      <Head
        pagetitle={t("timeline.pagetitle")}
        pageDesc={t("timeline.metaDesc")}
        jsonLd={jsonLd}
      />
      <Header fixed={false} />
      <Breadcrumbs name={t("timeline.breadcrumb")} />
      <section className="section-grid section-padding">
        <Title sectiontitle={t("timeline.sectionTitle")} />
        <p className={styles.lead}>{t("timeline.lead")}</p>
        <div
          className={styles.viewToggle}
          role="tablist"
          aria-label={t("timeline.viewToggle.label")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "simple"}
            className={`${styles.viewToggleButton} ${
              viewMode === "simple" ? styles.viewToggleActive : ""
            }`}
            onClick={() => switchMode("simple")}
          >
            {t("timeline.viewToggle.simple")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "full"}
            className={`${styles.viewToggleButton} ${
              viewMode === "full" ? styles.viewToggleActive : ""
            }`}
            onClick={() => switchMode("full")}
          >
            {t("timeline.viewToggle.full")}
          </button>
        </div>
        {viewMode === "simple" ? (
          <EmakiTimelineSimple rows={simpleRows} liveSlugs={liveSlugs} t={t} />
        ) : (
          <EmakiTimeline rows={rows} liveSlugs={liveSlugs} t={t} />
        )}
        <p className={styles.note}>{t("timeline.note")}</p>
      </section>
      <Footer />
    </>
  );
};

export default Timeline;

export const getStaticProps = async ({ locale }) => {
  // en の本文は未翻訳のため ja にフォールバック（ja/en 同時公開を維持）
  const source = locale === "en" ? enTimeline : jaTimeline;
  const rows = source.length ? source : jaTimeline;

  // 簡易版は ja/en 両方を手動管理（en があれば使用、なければ ja フォールバック）
  const sourceSimple = locale === "en" ? enTimelineSimple : jaTimelineSimple;
  const simpleRows = sourceSimple.length ? sourceSimple : jaTimelineSimple;

  // ビューア公開中（withdrawn 除外）の titleen 集合。未公開作品は「準備中」表示にする
  const liveSlugs = getLiveSlugs();

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      rows,
      simpleRows,
      liveSlugs,
    },
  };
};
