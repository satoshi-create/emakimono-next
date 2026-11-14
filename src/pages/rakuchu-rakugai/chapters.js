import HubPageShell from "@/components/layout/HubPageShell";
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
  const { locale, defaultLocale } = useRouter();

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

  return (
    <HubPageShell
      meta={{
        pagetitle: t("rakuchuRakugaiHub.pagetitle"),
        pageDesc: t("rakuchuRakugaiHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("rakuchuRakugaiHub.breadcrumb") }}
      hero={hero}
      sections={[{ id: "scrolls", content: scrollsSection }]}
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