import styles from "@/styles/ViewerDiscoveryRail.module.css";
import { RAKUCHU_RAKUGAI_CLUSTER_TITLEEN } from "@/libs/constants/discoveryLinks";
import { HOME_LATEST_SCROLLS } from "@/libs/constants/links";
import {
  expandDiscoveryTitleens,
  resolveViewerDiscoveryPlan,
} from "@/utils/resolveViewerDiscovery";
import ExtractingListData from "@/utils/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useMemo, useContext } from "react";
import { useTranslation } from "next-i18next";
import { AppContext } from "@/pages/_app";

/**
 * YouTube 風「次に見る」レール。クラスター／最新を優先（累計ランキングではない）。
 */
const ViewerDiscoveryRail = ({ data, onClose, expandClickGuardUntilRef }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const all = ExtractingListData();
  const context = useContext(AppContext);
  const rankingList = context?.rankingData || [];

  const { plan, relatedItems, byobuItems, scrollItems } = useMemo(() => {
    const p = resolveViewerDiscoveryPlan(data);
    const byTitleen = new Map(all.map((item) => [item.titleen, item]));

    const relatedItems = (p.titleens || [])
      .map((id) => byTitleen.get(id))
      .filter(Boolean);

    const isCurrentRakuchu = Boolean(
      data?.titleen && RAKUCHU_RAKUGAI_CLUSTER_TITLEEN.includes(data.titleen)
    );

    const byobuItems = !isCurrentRakuchu
      ? RAKUCHU_RAKUGAI_CLUSTER_TITLEEN.map((id) => byTitleen.get(id)).filter(
          Boolean
        )
      : [];

    const exclude = new Set([
      data?.titleen,
      ...relatedItems.map((i) => i.titleen),
      ...RAKUCHU_RAKUGAI_CLUSTER_TITLEEN,
    ]);

    const candidatePool =
      rankingList.length > 0
        ? rankingList
        : Array.isArray(all)
          ? all
          : [];

    const scrollTitleenCandidates = [];
    const pushTitleen = (titleen) => {
      if (!titleen || exclude.has(titleen)) return;
      if (scrollTitleenCandidates.includes(titleen)) return;
      scrollTitleenCandidates.push(titleen);
    };

    for (const s of HOME_LATEST_SCROLLS) {
      pushTitleen(s.titleen);
      if (scrollTitleenCandidates.length >= 6) break;
    }

    if (scrollTitleenCandidates.length < 6) {
      const expanded = expandDiscoveryTitleens(
        p.titleens,
        data?.titleen,
        10,
        Boolean(p.noExpand)
      );
      for (const id of expanded) {
        pushTitleen(id);
        if (scrollTitleenCandidates.length >= 6) break;
      }
    }

    if (scrollTitleenCandidates.length < 6) {
      for (const item of candidatePool) {
        pushTitleen(item?.titleen || item?.pathName);
        if (scrollTitleenCandidates.length >= 6) break;
      }
    }

    const scrollItems = scrollTitleenCandidates.slice(0, 6).map((id) => {
      const fromPool = candidatePool.find(
        (item) => (item?.titleen || item?.pathName) === id
      );
      const baseItem = byTitleen.get(id) || fromPool;
      if (!baseItem) return null;
      if (fromPool && typeof fromPool.pageView === "number") {
        return { ...baseItem, pageView: fromPool.pageView };
      }
      return baseItem;
    }).filter(Boolean);

    return { plan: p, relatedItems, byobuItems, scrollItems };
  }, [all, data, rankingList]);

  const stopRailAsideBubble = (e) => {
    if (
      expandClickGuardUntilRef?.current &&
      Date.now() < expandClickGuardUntilRef.current
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
  };

  return (
    <div className={styles.rail}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t(plan.titleKey)}</h2>
        <div className={styles.headActions}>
          {plan.ctaHref && (
            <Link href={plan.ctaHref}>
              <a className={styles.hubCta} onClick={stopRailAsideBubble}>
                {t(plan.ctaKey)} →
              </a>
            </Link>
          )}
          {onClose && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t("discovery.railCollapseAria")}
            >
              {t("discovery.railCollapse")}
            </button>
          )}
        </div>
      </div>
      <p className={styles.lead}>{t("discovery.railLead")}</p>
      {relatedItems.length === 0 &&
      byobuItems.length === 0 &&
      scrollItems.length === 0 ? (
        <p className={styles.empty}>{t("discovery.railEmpty")}</p>
      ) : (
        <ul className={styles.list}>
          {relatedItems.map((item) => (
            <li key={item.titleen}>
              <Link href={`/${item.titleen}`}>
                <a className={styles.card} onClick={stopRailAsideBubble}>
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
                    <div className={styles.metaRow}>
                      <span className={styles.hint}>
                        {t("discovery.watchHint")}
                      </span>
                      {typeof item.pageView === "number" && (
                        <span className={styles.viewCount}>
                          <span className={styles.viewIcon} aria-hidden="true">
                            👁
                          </span>
                          {item.pageView.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </span>
                </a>
              </Link>
            </li>
          ))}
          {byobuItems.length > 0 && (
            <>
              <li className={styles.sectionHeader} aria-hidden="true">
                <span className={styles.sectionTitle}>
                  {locale === "en"
                    ? "Rakuchū Rakugai Screens"
                    : "洛中洛外図屏風（特集）"}
                </span>
              </li>
              {byobuItems.map((item) => (
                <li key={item.titleen}>
                  <Link href={`/${item.titleen}`}>
                    <a className={styles.card} onClick={stopRailAsideBubble}>
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
                        <div className={styles.metaRow}>
                          <span className={styles.hint}>
                            {t("discovery.watchHint")}
                          </span>
                          {typeof item.pageView === "number" && (
                            <span className={styles.viewCount}>
                              <span
                                className={styles.viewIcon}
                                aria-hidden="true"
                              >
                                👁
                              </span>
                              {item.pageView.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </span>
                    </a>
                  </Link>
                </li>
              ))}
            </>
          )}
          {scrollItems.length > 0 && (
            <>
              <li className={styles.sectionHeader} aria-hidden="true">
                <span className={styles.sectionTitle}>
                  {locale === "en"
                    ? "Recommended Scrolls"
                    : "おすすめ・人気の絵巻"}
                </span>
              </li>
              {scrollItems.map((item) => (
                <li key={item.titleen}>
                  <Link href={`/${item.titleen}`}>
                    <a className={styles.card} onClick={stopRailAsideBubble}>
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
                        <div className={styles.metaRow}>
                          <span className={styles.hint}>
                            {t("discovery.watchHint")}
                          </span>
                          {typeof item.pageView === "number" && (
                            <span className={styles.viewCount}>
                              <span
                                className={styles.viewIcon}
                                aria-hidden="true"
                              >
                                👁
                              </span>
                              {item.pageView.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </span>
                    </a>
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
      <Link href="/ranking">
        <a className={styles.rankingLink} onClick={stopRailAsideBubble}>
          {t("discovery.ctaRanking")}
        </a>
      </Link>
    </div>
  );
};

export default ViewerDiscoveryRail;
