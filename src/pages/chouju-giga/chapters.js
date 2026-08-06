import HubPageShell from "@/components/layout/HubPageShell";
import ChojuGigaScrollCard from "@/components/emaki/chouju-giga/ChojuGigaScrollCard";
import Title from "@/components/ui/Title";
import styles from "@/styles/ChoujuGigaHub.module.css";
import { buildChojuGigaHubData } from "@/utils/buildChojuGigaHubData";
import { buildChojuGigaHubJsonLd } from "@/utils/buildChojuGigaHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

/**
 * Cloudinary loader for hero images.
 * Applies smart fill crop, auto format, quality, and a subtle dark
 * gradient overlay at the bottom for text readability.
 */
const heroLoader = ({ src, width, quality }) => {
  return `${CLOUDINARY_BASE},w_${width},ar_16:9,c_fill,g_auto` +
    `,f_auto,q_${quality || 75}` +
    `,co_black,e_gradient_fade:y_-0.4/${src}`;
};

const ChoujuGigaHub = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();

  const jsonLd = buildChojuGigaHubJsonLd({
    locale,
    defaultLocale,
    pageName: t("choujuGigaHub.pagetitle"),
    pageDescription: t("choujuGigaHub.metaDesc"),
    siteTitle: meta.siteTitle,
    hubData,
  });

  const hero = (
    <section className={styles.hero}>
      {(hubData.heroCloudinary || hubData.heroThumb) && (
        <div className={styles.heroImageWrap}>
          {hubData.heroCloudinary ? (
            <Image
              loader={heroLoader}
              src={hubData.heroCloudinary}
              alt="鳥獣人物戯画"
              width={1600}
              height={900}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          ) : (
            <Image
              src={hubData.heroThumb}
              alt="鳥獣人物戯画"
              width={800}
              height={450}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          )}
        </div>
      )}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>{t("choujuGigaHub.introTitle")}</h1>
        <p className={styles.introLead}>{t("choujuGigaHub.intro")}</p>
      </div>
    </section>
  );

  const scrollsSection = (
    <section className={`section-grid section-padding ${styles.scrollSection}`}>
      <Title sectiontitle={t("choujuGigaHub.scrollSectionTitle")} />
      <div className={styles.scrollGrid}>
        {hubData.scrolls.map((scroll) => (
          <ChojuGigaScrollCard key={scroll.titleen} scroll={scroll} />
        ))}
      </div>
    </section>
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: t("choujuGigaHub.pagetitle"),
        pageDesc: t("choujuGigaHub.metaDesc"),
        jsonLd,
      }}
      breadcrumb={{ name: t("choujuGigaHub.breadcrumb") }}
      hero={hero}
      sections={[{ id: "scrolls", content: scrollsSection }]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      hubData: buildChojuGigaHubData(),
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default ChoujuGigaHub;
