import { DISCOVERY_SPOTLIGHT_GROUPS } from "@/libs/constants/discoveryLinks";
import styles from "@/styles/DiscoverySpotlight.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";

/**
 * 入口ページ用: キュレーションされた絵巻への落下導線。
 * /type/emaki・/ranking に配置。
 */
const DiscoverySpotlight = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const all = ExtractingListData();

  const groups = useMemo(() => {
    const byTitleen = new Map(all.map((item) => [item.titleen, item]));
    return DISCOVERY_SPOTLIGHT_GROUPS.map((group) => {
      const items = group.titleens
        .map((titleen) => byTitleen.get(titleen))
        .filter(Boolean);
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [all]);

  if (groups.length === 0) return null;

  return (
    <section className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("discovery.sectionTitle")}</h2>
      <p className={styles.lead}>{t("discovery.sectionLead")}</p>
      {groups.map((group) => (
        <div key={group.id} className={styles.group}>
          <div className={styles.groupHead}>
            <h3 className={styles.groupTitle}>{t(group.titleKey)}</h3>
            {group.ctaHref && (
              <Link href={group.ctaHref}>
                <a className={styles.cta}>{t(group.ctaKey)} →</a>
              </Link>
            )}
          </div>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.titleen}>
                <Link href={`/${item.titleen}`}>
                  <a className={styles.card}>
                    {item.thumb && (
                      <span className={styles.thumbWrap}>
                        <Image
                          src={item.thumb}
                          alt=""
                          width={120}
                          height={68}
                          sizes="120px"
                          loading="lazy"
                        />
                      </span>
                    )}
                    <span className={styles.body}>
                      <span className={styles.itemTitle}>
                        {locale === "en" ? item.titleen : item.title}
                        {locale === "ja" && item.edition
                          ? ` ${item.edition}`
                          : ""}
                      </span>
                      <span className={styles.hint}>
                        {t("discovery.watchHint")}
                      </span>
                    </span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};

export default DiscoverySpotlight;
