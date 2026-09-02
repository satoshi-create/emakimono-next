import HomeGalleryLink from "@/components/home/HomeGalleryLink";
import Title from "@/components/ui/Title";
import { HOME_LATEST_SCROLLS } from "@/libs/constants/links";
import styles from "@/styles/HomeLatestScrolls.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";

const formatPublishedAt = (publishedAt, locale) => {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;
  if (locale === "ja") {
    return `${date.getFullYear()}年${date.getMonth() + 1}月公開`;
  }
  return date.toLocaleDateString("en", { year: "numeric", month: "long" });
};

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
      <Title
        sectiontitle={t("home.latestSectionTitle")}
        sectiontitleen={t("home.latestSectionTitle")}
      />
      <div className={styles.track}>
        {latestItems.map((item) => (
          <Link href={`/${item.titleen}`} key={item.titleen}>
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
                    {formatPublishedAt(item.publishedAt, locale)}
                  </span>
                </div>
                <h3 className={styles.title}>
                  {locale === "en" ? item.titleen : item.title}
                  {locale === "ja" && item.edition ? ` ${item.edition}` : ""}
                </h3>
                <span className={styles.era}>
                  {locale === "en"
                    ? `${item.eraen} period`
                    : `${item.era}時代`}
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>
      <HomeGalleryLink />
    </section>
  );
};

export default HomeLatestScrolls;
