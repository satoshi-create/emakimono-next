import { LinkedPublicBoards } from "@/components/hub/LinkedPublicBoards";
import HubPageShell from "@/components/layout/HubPageShell";
import ChojuGigaScrollCard from "@/components/emaki/chouju-giga/ChojuGigaScrollCard";
import Title from "@/components/ui/Title";
import styles from "@/styles/ChoujuGigaHub.module.css";
import { buildChojuGigaHubData } from "@/utils/buildChojuGigaHubData";
import { buildChojuGigaHubJsonLd } from "@/utils/buildChojuGigaHubJsonLd";
import { useLocaleMeta } from "@/utils/func";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

const HUB_SLUG = "chouju-giga";

const heroLoader = createCloudinaryHeroLoader("g_auto");

function parseHubSlugsFromDescription(description) {
  if (!description || typeof description !== "string") return [];
  const match = description.match(/<!--\s*hubs:\s*([^>]+)\s*-->/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function filterBoardsLinkedToHub(boards, hubSlug) {
  return (boards || []).filter((board) =>
    parseHubSlugsFromDescription(board.description).includes(hubSlug),
  );
}

const ChoujuGigaHub = ({ hubData }) => {
  const { t } = useTranslation("common");
  const { t: meta } = useLocaleMeta();
  const { locale, defaultLocale } = useRouter();
  const [linkedBoards, setLinkedBoards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPublicBoards();
        if (cancelled) return;
        setLinkedBoards(filterBoardsLinkedToHub(res?.boards, HUB_SLUG));
      } catch {
        if (!cancelled) setLinkedBoards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <LinkedPublicBoards
        boards={linkedBoards}
        locale={locale}
        ariaLabel={t("choujuGigaHub.linkedPublicBoardsAria")}
        className={styles.introLead}
      />
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
