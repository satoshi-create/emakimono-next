import ActionButton from "@/components/emaki/viewer/ActionButton";
import * as gtag from "@/libs/api/gtag";
import styles from "@/styles/ShareButtons.module.css";
import {
  buildLineShareUrl,
  buildShareUrl,
  buildTwitterShareUrl,
} from "@/utils/buildShareUrl";
import {
  faCheck,
  faLink,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";

const trackShare = ({ platform, emakiId, sceneIndex }) => {
  gtag.event("sns_share_click", {
    platform,
    emaki_id: emakiId || "",
    scene_index: sceneIndex ?? 0,
  });
};

/**
 * Share controls: copy URL, X, LINE, and Web Share API (mobile).
 * @param {object} props
 * @param {number} [props.navIndex=0] - Scene index for hash (#n)
 * @param {string} [props.emakiId] - titleen for analytics
 * @param {string} [props.shareTitle] - Tweet / native share title
 * @param {"navigation"|"overlay"|"inline"} [props.variant="navigation"]
 * @param {boolean} [props.isUIVisible=true]
 */
const ShareButtons = ({
  navIndex = 0,
  emakiId = "",
  shareTitle = "",
  variant = "navigation",
  isUIVisible = true,
}) => {
  const { locale, locales, asPath, defaultLocale } = useRouter();
  const { t } = useTranslation("common");
  const [isCopied, setIsCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        locale,
        asPath,
        locales,
        defaultLocale,
        navIndex,
      }),
    [locale, asPath, locales, defaultLocale, navIndex]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      trackShare({ platform: "copy", emakiId, sceneIndex: navIndex });
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error("Share URL copy failed:", err);
    }
  };

  const handleTwitter = () => {
    trackShare({ platform: "x", emakiId, sceneIndex: navIndex });
    window.open(
      buildTwitterShareUrl(shareUrl, shareTitle),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleLine = () => {
    trackShare({ platform: "line", emakiId, sceneIndex: navIndex });
    window.open(buildLineShareUrl(shareUrl), "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle || t("header.siteTitle"),
        url: shareUrl,
      });
      trackShare({ platform: "native", emakiId, sceneIndex: navIndex });
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Web Share failed:", err);
      }
    }
  };

  const copyLabel = isCopied ? t("viewer.copied") : t("viewer.copySceneUrl");
  const rowClass = `${styles.row} ${styles[variant] || ""}`;

  const renderCopyIcon = () => (
    <FontAwesomeIcon
      icon={isCopied ? faCheck : faLink}
      style={
        variant === "navigation" ? { fontSize: "1.3em" } : undefined
      }
      className={`${variant === "overlay" ? styles.overlayIcon : ""} ${
        isCopied ? styles.copied : ""
      }`.trim()}
    />
  );

  const renderXIcon = () => {
    const className = [
      styles.brandIcon,
      variant === "navigation" || variant === "overlay"
        ? styles.brandIconLight
        : "",
      variant === "overlay" ? styles.overlayIcon : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (variant === "overlay") {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/svg/x.svg" alt="" className={className} />
      );
    }

    return (
      <Image
        src="/svg/x.svg"
        alt="X"
        width={16}
        height={16}
        className={className}
      />
    );
  };

  const renderLineIcon = () => (
    <span
      className={`${styles.lineLabel} ${
        variant === "overlay" ? styles.overlayLineLabel : ""
      }`}
      aria-hidden="true"
    >
      LINE
    </span>
  );

  if (variant === "navigation") {
    return (
      <div className={rowClass} role="group" aria-label={t("share.groupLabel")}>
        <ActionButton
          icon={renderCopyIcon()}
          label={t("viewer.copyUrl")}
          description={copyLabel}
          onClick={handleCopy}
          isUIVisible={isUIVisible}
        />
        {canNativeShare ? (
          <ActionButton
            icon={
              <FontAwesomeIcon
                icon={faShareNodes}
                style={{ fontSize: "1.3em" }}
              />
            }
            label={t("share.native")}
            description={t("share.nativeDesc")}
            onClick={handleNativeShare}
            isUIVisible={isUIVisible}
          />
        ) : (
          <>
            <ActionButton
              icon={renderXIcon()}
              label={t("share.x")}
              description={t("share.xDesc")}
              onClick={handleTwitter}
              isUIVisible={isUIVisible}
            />
            <ActionButton
              icon={renderLineIcon()}
              label={t("share.line")}
              description={t("share.lineDesc")}
              onClick={handleLine}
              isUIVisible={isUIVisible}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={rowClass} role="group" aria-label={t("share.groupLabel")}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={handleCopy}
        title={copyLabel}
        aria-label={copyLabel}
      >
        {renderCopyIcon()}
      </button>
      {canNativeShare ? (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleNativeShare}
          title={t("share.nativeDesc")}
          aria-label={t("share.nativeDesc")}
        >
          <FontAwesomeIcon icon={faShareNodes} className={styles.overlayIcon} />
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleTwitter}
            title={t("share.xDesc")}
            aria-label={t("share.xDesc")}
          >
            {renderXIcon()}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleLine}
            title={t("share.lineDesc")}
            aria-label={t("share.lineDesc")}
          >
            {renderLineIcon()}
          </button>
        </>
      )}
    </div>
  );
};

export default ShareButtons;
