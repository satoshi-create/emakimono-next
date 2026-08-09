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
      <p className={styles.sourceLine}>
        <AttributionLink
          href={sourceLinkUrl}
          linkClassName={linkClassName}
          linkStyle={linkStyle}
        >
          {sourceLine}
        </AttributionLink>
      </p>
      {licenseLine && licenseLinkUrl && (
        <p className={styles.licenseLine}>
          <AttributionLink
            href={licenseLinkUrl}
            linkClassName={linkClassName}
            linkStyle={linkStyle}
          >
            {licenseLine}
          </AttributionLink>
        </p>
      )}
      {modifiedLine && <p className={styles.modifiedLine}>{modifiedLine}</p>}
      <p className={styles.guideLine}>
        <Link href="/copyright">
          <a className={styles.guideLink}>{t("sourceAttribution.seeGuide")}</a>
        </Link>
      </p>
    </div>
  );
};

export default SourceAttribution;
