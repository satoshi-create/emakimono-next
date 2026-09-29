import styles from "@/styles/ViewerDiscoveryRail.module.css";
import {
  expandDiscoveryTitleens,
  resolveViewerDiscoveryPlan,
} from "@/utils/resolveViewerDiscovery";
import ExtractingListData from "@/utils/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";

/**
 * YouTube 風「次に見る」レール。クラスター／最新を優先（累計ランキングではない）。
 */
const ViewerDiscoveryRail = ({ data, onClose }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const all = ExtractingListData();

  const { plan, items } = useMemo(() => {
    const p = resolveViewerDiscoveryPlan(data);
    const titleens = expandDiscoveryTitleens(p.titleens, data?.titleen, 6);
    const byTitleen = new Map(all.map((item) => [item.titleen, item]));
    return {
      plan: p,
      items: titleens.map((id) => byTitleen.get(id)).filter(Boolean),
    };
  }, [all, data]);

  return (
    <div className={styles.rail}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t(plan.titleKey)}</h2>
        <div className={styles.headActions}>
          {plan.ctaHref && (
            <Link href={plan.ctaHref}>
              <a className={styles.hubCta}>{t(plan.ctaKey)} →</a>
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t("discovery.railCollapse")}
            >
              {t("discovery.railCollapse")}
            </button>
          )}
        </div>
      </div>
      <p className={styles.lead}>{t("discovery.railLead")}</p>
      {items.length === 0 ? (
        <p className={styles.empty}>{t("discovery.railEmpty")}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.titleen}>
              <Link href={`/${item.titleen}`}>
                <a className={styles.card}>
                  {item.thumb && (
                    <span className={styles.thumbWrap}>
                      <Image
                        src={item.thumb}
                        alt=""
                        width={112}
                        height={63}
                        sizes="112px"
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
      )}
      <Link href="/ranking">
        <a className={styles.rankingLink}>{t("discovery.ctaRanking")}</a>
      </Link>
    </div>
  );
};

export default ViewerDiscoveryRail;
