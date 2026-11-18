import HubPageShell from "@/components/layout/HubPageShell";
import {
  RakuchuCompositionSection,
  RakuchuMotifSection,
} from "@/components/rakuchu-rakugai/RakuchuMotifExplorer";
import RakuchuSightseeingMapSection from "@/components/rakuchu-rakugai/RakuchuSightseeingMapSection";
import { FORM_TAB_IDS } from "@/components/rakuchu-rakugai/rakuchuScrollConstants";
import Title from "@/components/ui/Title";
import { RAKUCHU_RAKUGAI_HUB_PATH } from "@/libs/constants/links";
import styles from "@/styles/ChoujuGigaHub.module.css";
import { buildRakuchuRakugaiHubData } from "@/utils/buildRakuchuRakugaiHubData";
import { useLocaleMeta } from "@/utils/func";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
function scrollLabelForTitleen(scroll, locale) {
  if (!scroll) return "";
  return locale === "ja"
    ? `${scroll.title}${scroll.edition ? ` ${scroll.edition}` : ""}`
    : scroll.titleen;
}

function firstSentence(text) {
  if (!text) return "";
  const match = text.match(/^.*?[。！？\n.!?]/);
  return match ? match[0].trim() : text.slice(0, 100).trim();
}

const RakuchuRakugaiScrollCard = ({ scroll }) => {
  const { locale } = useRouter();
  const {
    titleen,
    title,
    thumb,
    era,
    eraen,
    author,
    authoren,
    desc,
    descen,
    edition,
  } = scroll;

  const scrollTitle =
    locale === "ja"
      ? `${title}${edition ? ` ${edition}` : ""}`
      : titleen;
  const snippet = locale === "en" ? firstSentence(descen) : firstSentence(desc);

  return (
    <article className={styles.scrollCard}>
      <Link href={`/${titleen}`}>
        <a className={styles.scrollCardInner}>
          {thumb && (
            <div className={styles.scrollCardThumbWrap}>
              <Image
                src={thumb}
                alt={title}
                width={533}
                height={300}
                sizes="(max-width: 768px) 100vw, 300px"
                loading="lazy"
                className={styles.scrollCardThumb}
              />
            </div>
          )}
          <div className={styles.scrollCardBody}>
            <h3 className={styles.cardTitle}>{scrollTitle}</h3>
            <div className={styles.cardMeta}>
              {era && (
                <span className={styles.cardEra}>
                  {locale === "en" ? `${eraen} period` : `${era}時代`}
                </span>
              )}
              {author && (
                <span className={styles.cardAuthor}>
                  {locale === "ja" ? author : authoren}
                </span>
              )}
            </div>
            {snippet && <p className={styles.cardSnippet}>{snippet}</p>}
          </div>
        </a>
      </Link>
    </article>
  );
};

const RakuchuRakugaiHub = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale, query } = useRouter();
  const formFromQuery =
    typeof query.form === "string" && FORM_TAB_IDS.includes(query.form)
      ? query.form
      : undefined;
  const motifFromQuery =
    typeof query.motif === "string" ? query.motif : undefined;

  const scrollByTitleen = Object.fromEntries(
    hubData.scrolls.map((s) => [s.titleen, s])
  );

  const pageUrl =
    locale === defaultLocale
      ? `https://emakimono.com${RAKUCHU_RAKUGAI_HUB_PATH}`
      : `https://emakimono.com/${locale}${RAKUCHU_RAKUGAI_HUB_PATH}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("rakuchuRakugaiHub.pagetitle"),
    description: t("rakuchuRakugaiHub.metaDesc"),
    url: pageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: meta.siteTitle,
      url: "https://emakimono.com",
    },
    hasPart: hubData.scrolls.map((s) => ({
      "@type": "VisualArtwork",
      name: locale === "en" ? s.titleen : s.title,
      url:
        locale === defaultLocale
          ? `https://emakimono.com/${s.titleen}`
          : `https://emakimono.com/${locale}/${s.titleen}`,
    })),
  };

  const hero = (
    <section className={styles.hero}>
      {hubData.heroThumb && (
        <div className={styles.heroImageWrap}>
          <Image
            src={hubData.heroThumb}
            alt={t("rakuchuRakugaiHub.introTitle")}
            width={800}
            height={450}
            sizes="100vw"
            priority
            className={styles.heroImage}
          />
        </div>
      )}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>{t("rakuchuRakugaiHub.introTitle")}</h1>
        <p className={styles.introLead}>{t("rakuchuRakugaiHub.intro")}</p>
      </div>
    </section>
  );

  const scrollsSection = (
    <section className={`section-grid section-padding ${styles.scrollSection}`}>
      <Title sectiontitle={t("rakuchuRakugaiHub.scrollSectionTitle")} />
      <div className={styles.scrollGrid}>
        {hubData.scrolls.map((scroll) => (
          <RakuchuRakugaiScrollCard key={scroll.titleen} scroll={scroll} />
        ))}
      </div>
    </section>
  );

  const compositionSection = (
    <section
      className={`section-padding ${styles.scrollSection}`}
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        scrollMarginTop: "96px",
      }}
    >
      <div
        style={{
          maxWidth: "min(96vw, 1560px)",
          margin: "0 auto",
          paddingLeft: "clamp(12px, 2vw, 24px)",
          paddingRight: "clamp(12px, 2vw, 24px)",
          boxSizing: "border-box",
        }}
      >
        <Title
          sectiontitle={
            locale === "en" ? "Composition Lineages" : "構図形式の比較"
          }
        />
        <p
          className={styles.introLead}
          style={{
            textAlign: "center",
            maxWidth: "42rem",
            margin: "0 auto 2.25rem",
            lineHeight: 1.85,
          }}
        >
          {locale === "en"
            ? "Screen layout shifts by period and patron: compare the spatial pairing of the Right (East) and Left (West) screens."
            : "時代や発注背景によって屏風全体の構図形式が異なります。右隻（東側）と左隻（西側）の主役の対比を比較できます。"}
        </p>
        <RakuchuCompositionSection
          motifVisuals={hubData.motifVisuals}
          stripsByTitleen={hubData.stripsByTitleen}
          locale={locale}
          initialForm={formFromQuery}
        />
      </div>
    </section>
  );

  const motifsSection = (
    <section
      id="motifs"
      className={`section-grid section-padding ${styles.scrollSection}`}
    >
      <Title
        sectiontitle={
          locale === "en" ? "Key Motifs Across Scrolls" : "主要モチーフの比較"
        }
      />
      <p
        className={styles.introLead}
        style={{
          textAlign: "center",
          maxWidth: "42rem",
          margin: "0 auto 2.25rem",
          lineHeight: 1.85,
        }}
      >
        {locale === "en"
          ? "Compare how iconic Kyoto landmarks, rivers, and festivals are depicted across the three screens."
          : "京都を代表する名所・河川・祭礼が、3つの伝本それぞれにどのように描かれているかを図像で見比べられます。"}
      </p>
      <RakuchuMotifSection
        motifVisuals={hubData.motifVisuals}
        locale={locale}
        highlightMotifId={motifFromQuery}
      />
    </section>
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: t("rakuchuRakugaiHub.pagetitle"),
        pageDesc: t("rakuchuRakugaiHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("rakuchuRakugaiHub.breadcrumb") }}
      hero={hero}
      sections={[
        { id: "scrolls", content: scrollsSection },
        { id: "composition", content: compositionSection },
        { id: "motifs", content: motifsSection },
        {
          id: "sightseeing-map",
          navLabel:
            locale === "en" ? "Kyoto Map & Routes" : "京都観光マップ",
          title:
            locale === "en"
              ? "Kyoto Sightseeing Map & Recommended Routes"
              : "京都観光マップ・おすすめルート",
          lead:
            locale === "en"
              ? "Explore temples, rivers, and streets depicted in Rakuchu-Rakugai-zu screens on the map of Kyoto, and follow curated walking routes."
              : "洛中洛外図屏風に描かれた寺社・河川・町並みを現在の京都地図と照らし合わせ、テーマ別の散策ルートを辿れます。",
          content: <RakuchuSightseeingMapSection locale={locale} />,
        },
      ]}
    />
  );
};

export const getStaticProps = async ({ locale }) => ({
  props: {
    hubData: buildRakuchuRakugaiHubData(),
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

export default RakuchuRakugaiHub;