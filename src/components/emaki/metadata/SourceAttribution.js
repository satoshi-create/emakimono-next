import styles from "@/styles/SourceAttribution.module.css";
import {
  formatSourceAttribution,
  getLicenseBadge,
  getSourceDisplayTitle,
} from "@/utils/formatSourceAttribution";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const AttributionLink = ({ href, children, linkClassName, linkStyle }) => {
  const linkClasses = [styles.link, linkClassName].filter(Boolean).join(" ");
  return (
    <Link href={href}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
        style={linkStyle}
      >
        {children}
      </a>
    </Link>
  );
};

const SourceAttribution = ({
  sourceImageUrl,
  sourceImage = "",
  sourceTitle = "",
  sourceTitleen = "",
  sourceAuthor = "",
  sourceCollection = "",
  license = "",
  modified = true,
  linkClassName = "",
  linkStyle,
  className = "",
  showGuide = true,
}) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  if (!sourceImageUrl) {
    return sourceImage ? (
      <p className={`${styles.root} ${className}`.trim()}>{sourceImage}</p>
    ) : null;
  }

  const displayTitle = getSourceDisplayTitle({
    title: sourceTitle,
    titleen: sourceTitleen,
    locale,
  });

  const {
    sourceLine,
    licenseLine,
    modifiedLine,
    sourceLinkUrl,
    licenseLinkUrl,
    provider,
  } = formatSourceAttribution({
    sourceImageUrl,
    sourceImage,
    sourceTitle: displayTitle,
    sourceAuthor,
    sourceCollection,
    locale,
    t,
    modified,
    license,
  });

  const badge = getLicenseBadge({ provider, license, locale });

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      {badge && (
        <p className={styles.badgeLine}>
          <a
            href={badge.url || sourceImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.badge} ${styles[`tone-${badge.tone}`]}`}
            title={t(`sourceAttribution.badgeTitles.${badge.tone}`)}
          >
            {badge.label ?? t(`sourceAttribution.badgeLabels.${badge.labelKey}`)}
          </a>
        </p>
      )}
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.label}>{t("sourceAttribution.labelSource")}</dt>
          <dd className={styles.value}>
            <AttributionLink
              href={sourceLinkUrl}
              linkClassName={linkClassName}
              linkStyle={linkStyle}
            >
              {sourceLine}
            </AttributionLink>
          </dd>
        </div>
        {/* ライセンスはバッジ表示時に統合する（重複を避ける） */}
        {!badge && licenseLine && licenseLinkUrl && (
          <div className={styles.row}>
            <dt className={styles.label}>{t("sourceAttribution.labelLicense")}</dt>
            <dd className={styles.value}>
              <AttributionLink
                href={licenseLinkUrl}
                linkClassName={linkClassName}
                linkStyle={linkStyle}
              >
                {licenseLine}
              </AttributionLink>
            </dd>
          </div>
        )}
        {modifiedLine && (
          <div className={styles.row}>
            <dt className={styles.label}>{t("sourceAttribution.labelModified")}</dt>
            <dd className={styles.value}>{modifiedLine}</dd>
          </div>
        )}
      </dl>
      {showGuide && (
        <p className={styles.guideLine}>
          <Link href="/copyright">
            <a className={styles.guideLink}>{t("sourceAttribution.seeGuide")}</a>
          </Link>
        </p>
      )}
    </div>
  );
};

export default SourceAttribution;
