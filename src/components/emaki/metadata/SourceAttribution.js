import styles from "@/styles/SourceAttribution.module.css";
import { formatSourceAttribution, getSourceDisplayTitle } from "@/utils/formatSourceAttribution";
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
  } = formatSourceAttribution({
    sourceImageUrl,
    sourceImage,
    sourceTitle: displayTitle,
    sourceAuthor,
    sourceCollection,
    locale,
    t,
    modified,
  });

  return (
    <div className={`${styles.root} ${className}`.trim()}>
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
    </div>
  );
};

export default SourceAttribution;
