import styles from "@/styles/ViewerDiscoveryRail.module.css";
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

  const { plan, items, splitIndex } = useMemo(() => {
    const p = resolveViewerDiscoveryPlan(data);
    const TARGET_LIMIT = 10;
    const titleens = expandDiscoveryTitleens(p.titleens, data?.titleen, TARGET_LIMIT);
    const byTitleen = new Map(all.map((item) => [item.titleen, item]));
    const FUNAKI_TITLEEN = "rakuchu_rakugai_funaki";

    // 解決済みアイテムを収集
    const seen = new Set([data?.titleen, FUNAKI_TITLEEN, ...titleens]);
    const planned = titleens
      .map((id) => byTitleen.get(id))
      .filter(Boolean)
      .filter((item) => item.titleen !== FUNAKI_TITLEEN);

    // 補充プール: AppContext のランキング（PV降順）を最優先し、無ければ all を使用
    const candidatePool = rankingList.length > 0 ? rankingList : (Array.isArray(all) ? all : []);

    // 枠が空いている場合、ランキング 1 位から順に重複のない作品を補充
    if (planned.length < TARGET_LIMIT - 1) {
      for (const item of candidatePool) {
        const titleen = item?.titleen || item?.pathName;
        if (!titleen || seen.has(titleen)) continue;
        const baseItem = byTitleen.get(titleen) || item;
        // rankingData 由来の pageView を確実に保持したオブジェクトを生成
        const matchedItem =
          typeof item?.pageView === "number"
            ? { ...baseItem, pageView: item.pageView }
            : baseItem;
        seen.add(titleen);
        planned.push(matchedItem);
        if (planned.length >= TARGET_LIMIT - 1) break;
      }
    }

    const funaki = byTitleen.get(FUNAKI_TITLEEN);
    const relatedList = funaki ? [funaki, ...planned] : planned;
    // ノートPC画面（縦幅が狭い環境）でもおすすめセクションが確実に視認できるよう、
    // 関連作品の初期枠を最大4件に抑えて早めにおすすめへ繋ぐ
    const maxRelatedOnRail = Math.min(4, titleens.length + (funaki ? 1 : 0));
    const relatedCount = Math.min(relatedList.length, maxRelatedOnRail);

    return {
      plan: p,
      items: relatedList.slice(0, TARGET_LIMIT),
      splitIndex: relatedCount,
    };
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
      {items.length === 0 ? (
        <p className={styles.empty}>{t("discovery.railEmpty")}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item, idx) => (
            <React.Fragment key={item.titleen}>
              {idx === splitIndex && idx < items.length && (
                <li className={styles.sectionHeader} aria-hidden="true">
                  <span className={styles.sectionTitle}>
                    {locale === "en"
                      ? "Recommended Scrolls"
                      : "おすすめ・人気の絵巻"}
                  </span>
                </li>
              )}
              <li>
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
                          <span className={styles.viewIcon} aria-hidden="true">👁</span>
                          {item.pageView.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </span>
                  </a>
                </Link>
              </li>
            </React.Fragment>
          ))}
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
