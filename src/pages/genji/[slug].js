import GenjiExcerptBlock from "@/components/emaki/genji/GenjiExcerptBlock";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import CardA from "@/components/ui/CardA";
import { GENJI_HUB_PATH } from "@/libs/constants/genjiSources";
import styles from "@/styles/GenjiHub.module.css";
import { getGenjiChapterByPath } from "@/utils/buildGenjiHubData";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import chapters from "@/data/emaki-text-data/chapters-of-genji.json";

const GenjiChapterPage = ({ chapter, relatedScrolls }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  const displayTitle = isEn ? chapter.titleen : chapter.title;
  const pageDesc = t("genjiHub.chapterMetaDesc", {
    title: displayTitle,
    num: chapter.chapter_en,
  });

  return (
    <>
      <Head
        pagetitle={t("genjiHub.chapterPagetitle", {
          title: displayTitle,
          num: chapter.chapter_en,
        })}
        pageDesc={pageDesc}
      />
      <Header />
      <Breadcrumbs
        name={displayTitle}
        test={t("genjiHub.breadcrumb")}
        testen={GENJI_HUB_PATH.replace(/^\//, "")}
      />
      <section
        className={`section-grid section-padding ${styles.detailSection}`}
      >
        <header className={styles.detailHeader}>
          <p className={styles.detailChapterLabel}>
            {t("genjiHub.chapterNumber", {
              num: isEn ? chapter.chapter_en : chapter.chapter_ch,
            })}
          </p>
          <h1 className={styles.detailTitle}>
            {!isEn ? (
              <ruby>
                {chapter.title} <rp>(</rp>
                <rt>{chapter.ruby}</rt>
                <rp>)</rp>
              </ruby>
            ) : (
              chapter.titleen
            )}
          </h1>
          {(chapter.mainCharacter || chapter.age) && (
            <p className={styles.detailMeta}>
              {[
                chapter.mainCharacter &&
                  t("genjiHub.mainCharacter", {
                    name: chapter.mainCharacter,
                  }),
                chapter.age && t("genjiHub.age", { age: chapter.age }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </header>

        {chapter.summary && (
          <p className={styles.detailSummary}>{chapter.summary}</p>
        )}

        <GenjiExcerptBlock
          label={t("genjiHub.excerptKobunLabel")}
          text={isEn ? chapter.kobunen || chapter.kobun : chapter.kobun}
          href={chapter.source_kobun_url}
          linkLabel={t("genjiHub.readFullKobun")}
          classical={!isEn}
        />
        <GenjiExcerptBlock
          label={t("genjiHub.excerptGendaibunLabel")}
          text={
            isEn ? chapter.gendaibunen || chapter.gendaibun : chapter.gendaibun
          }
          href={chapter.source_gendaibun_url}
          linkLabel={t("genjiHub.readFullGendaibun")}
        />

        <Link href={GENJI_HUB_PATH}>
          <a className={styles.hubBack}>{t("genjiHub.hubNudgeLabel")}</a>
        </Link>
      </section>

      {relatedScrolls?.length > 0 && (
        <CardA
          emakis={relatedScrolls}
          columns={"three"}
          sectiontitle={t("genjiHub.relatedScrollsTitle")}
          sectiontitleen={t("genjiHub.relatedScrollsTitle")}
        />
      )}
      <Footer />
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = chapters.map(({ path, titleen }) => ({
    params: { slug: path || titleen },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const slug = context.params.slug;
  const { locale } = context;
  const result = getGenjiChapterByPath(slug);
  if (!result) {
    return { notFound: true };
  }
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      chapter: result.chapter,
      relatedScrolls: result.relatedScrolls,
    },
  };
};

export default GenjiChapterPage;
