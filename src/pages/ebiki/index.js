/**
 * 絵引ハブ — 宮本常一の生活史 × 渋沢敬三『絵引』データベース
 */
import FolkloreCard from "@/components/emaki/folklore/FolkloreCard";
import HubPageShell from "@/components/layout/HubPageShell";
import { folkloreItems } from "@/data/folklore/folkloreIndex";
import styles from "@/styles/EbikiHub.module.css";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const FILTERS = [
  { id: "all", category: null },
  { id: "labor_trade", category: "labor_trade" },
  { id: "dwell", category: "dwell" },
  { id: "carry", category: "carry" },
  { id: "eat", category: "eat" },
  { id: "play_ritual", category: "play_ritual" },
  { id: "body_life", category: "body_life" },
  { id: "wear", category: "wear" },
];

const VALID_FILTER_IDS = new Set(FILTERS.map((f) => f.id));

const EbikiHubPage = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [active, setActive] = useState("all");

  // `/ebiki?category=labor_trade` 等で初期フィルタを同期
  useEffect(() => {
    const raw = router.query?.category;
    if (!raw) return;
    const cat = String(Array.isArray(raw) ? raw[0] : raw).trim();
    if (VALID_FILTER_IDS.has(cat) && cat !== "all") {
      setActive(cat);
    }
  }, [router.query?.category]);

  const filtered = useMemo(() => {
    if (active === "all") return folkloreItems;
    return folkloreItems.filter((item) => item.act_category === active);
  }, [active]);

  const hero = (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <h1 className={styles.heroTitle}>{t("ebikiHub.introTitle")}</h1>
        <p className={styles.heroLead}>{t("ebikiHub.intro")}</p>
      </div>
    </section>
  );

  const listSection = (
    <section className={`section-grid section-padding`}>
      <div className={styles.filters} role="tablist" aria-label={t("ebikiHub.filterLabel")}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active === f.id}
            className={`${styles.filterBtn} ${
              active === f.id ? styles.filterBtnActive : ""
            }`}
            onClick={() => setActive(f.id)}
          >
            {t(`ebikiHub.filters.${f.id}`)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className={styles.empty}>{t("ebikiHub.empty")}</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item) => (
            <FolkloreCard key={item.item_id} item={item} />
          ))}
        </div>
      )}
      <p className={styles.note}>{t("ebikiHub.attribution")}</p>
    </section>
  );

  return (
    <HubPageShell
      meta={{
        pagetitle: t("ebikiHub.pagetitle"),
        pageDesc: t("ebikiHub.metaDesc"),
      }}
      breadcrumb={{ name: t("ebikiHub.breadcrumb") }}
      hero={hero}
      sections={[{ id: "items", content: listSection }]}
    />
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};

export default EbikiHubPage;
