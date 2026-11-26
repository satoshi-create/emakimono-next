import HomeGalleryLink from "@/components/home/HomeGalleryLink";
import Title from "@/components/ui/Title";
import { RAKUCHU_RAKUGAI_CLUSTER_TITLEEN } from "@/libs/constants/discoveryLinks";
import { HOME_LATEST_SCROLLS } from "@/libs/constants/links";
import styles from "@/styles/HomeLatestScrolls.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";

const formatPublishedAt = (publishedAt, locale, t) => {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;
  if (locale === "en") {
    return date.toLocaleDateString("en", { year: "numeric", month: "long" });
  }
  return t("home.latest.published", {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  });
};

const scrollTitleForLocale = (item, locale) =>
  locale === "ja" ? item.title : item.titleen || item.title;

const HomeLatestScrolls = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const removeNestedArrayObj = ExtractingListData();

  const latestItems = useMemo(() => {
    const byTitleen = new Map(
      removeNestedArrayObj.map((item) => [item.titleen, item])
    );
    return HOME_LATEST_SCROLLS.map((entry) => {
      const emaki = byTitleen.get(entry.titleen);
      if (!emaki) return null;
      return { ...emaki, publishedAt: entry.publishedAt, order: entry.order };
    }).filter(Boolean);
  }, [removeNestedArrayObj]);

  if (latestItems.length === 0) return null;

  return (
    <section className={`section-grid section-padding ${styles.section}`}>
      <Title sectiontitle={t("home.latestSectionTitle")} />
      <div className={styles.track}>
        {latestItems.map((item) => {
          const isByobu =
            RAKUCHU_RAKUGAI_CLUSTER_TITLEEN.includes(item.titleen) ||
            item.type === "byobu";
          return (
          <Link href={`/${item.titleen}`} key={item.titleen} prefetch={false}>
            <a className={styles.card}>
              <div className={styles.thumbWrap}>
                <Image
                  src={item.thumb}
                  alt={item.title}
                  layout="fill"
                  objectFit="cover"
                  sizes="120px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                />
              </div>
              <div className={styles.body}>
                <div className={styles.metaRow}>
                  <span className={styles.orderBadge}>
                    {t("home.latestOrderBadge", { order: item.order })}
                  </span>
                  {item.order === 1 && (
                    <span className={styles.newBadge}>{t("home.latestNewBadge")}</span>
                  )}
                  <span className={styles.date}>
                    {formatPublishedAt(item.publishedAt, locale, t)}
                  </span>
                </div>
                <h3 className={styles.title}>
                  {scrollTitleForLocale(item, locale)}
                  {locale === "ja" && item.edition ? ` ${item.edition}` : ""}
                </h3>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span className={styles.era}>
                    {t("home.latest.eraPeriod", {
                      era: locale === "ja" ? item.era : item.eraen || item.era,
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      lineHeight: 1.2,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontWeight: 600,
                      ...(isByobu
                        ? {
                            color: "#c9a227",
                            background: "rgba(15, 23, 42, 0.92)",
                            border: "1px solid rgba(201, 162, 39, 0.45)",
                          }
                        : {
                            color: "#5c5348",
                            background: "#f5f0e6",
                            border: "1px solid rgba(92, 83, 72, 0.25)",
                          }),
                    }}
                  >
                    {isByobu
                      ? t("home.latest.typeByobu")
                      : t("home.latest.typeEmaki")}
                  </span>
                </div>
              </div>
            </a>
          </Link>
          );
        })}
      </div>
      <HomeGalleryLink />
    </section>
  );
};

export default HomeLatestScrolls;
