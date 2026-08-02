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
import { createPortal } from "react-dom";
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
 * @param {"menu"|"inline"} [props.variant="inline"] - menu: ナビ用の共有1ボタン（ポップオーバー）
 * @param {boolean} [props.isUIVisible=true]
 */
const ShareButtons = ({
  navIndex = 0,
  emakiId = "",
  shareTitle = "",
  variant = "inline",
  isUIVisible = true,
}) => {
  const { locale, locales, asPath, defaultLocale } = useRouter();
  const { t } = useTranslation("common");
  const [isCopied, setIsCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const openMenu = (e) => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
    setIsMenuOpen(true);
  };

  // 共有メニュー: 外側クリック / Esc / スクロール・リサイズ / UI非表示で閉じる
  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (e) => {
      if (e.target.closest('[data-share-menu="true"]')) return;
      setIsMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    const handleReposition = () => setIsMenuOpen(false);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    document.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      document.removeEventListener("scroll", handleReposition, true);
    };
  }, [isMenuOpen]);

  // UI非表示（静止耐性）になったらメニューも閉じる
  useEffect(() => {
    if (!isUIVisible && isMenuOpen) setIsMenuOpen(false);
  }, [isUIVisible, isMenuOpen]);

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
    setIsMenuOpen(false);
  };

  const handleTwitter = () => {
    trackShare({ platform: "x", emakiId, sceneIndex: navIndex });
    window.open(
      buildTwitterShareUrl(shareUrl, shareTitle),
      "_blank",
      "noopener,noreferrer"
    );
    setIsMenuOpen(false);
  };

  const handleLine = () => {
    trackShare({ platform: "line", emakiId, sceneIndex: navIndex });
    window.open(buildLineShareUrl(shareUrl), "_blank", "noopener,noreferrer");
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  const copyLabel = isCopied ? t("viewer.copied") : t("viewer.copySceneUrl");

  const renderCopyIcon = () => (
    <FontAwesomeIcon icon={isCopied ? faCheck : faLink} />
  );

  const renderXIcon = () => (
    <Image
      src="/svg/x.svg"
      alt="X"
      width={16}
      height={16}
      className={styles.brandIcon}
    />
  );

  const renderLineIcon = () => (
    <span className={styles.lineLabel} aria-hidden="true">
      LINE
    </span>
  );

  // ナビ用: 「共有」1ボタン + クリックでポップオーバー展開
  // ナビ aside は overflow-y:hidden のため、ポップオーバーは body 直下に portal 表示する
  if (variant === "menu") {
    return (
      <div
        className={styles.menuWrap}
        data-share-menu="true"
        role="group"
        aria-label={t("share.groupLabel")}
      >
        <ActionButton
          icon={
            <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: "1.3em" }} />
          }
          label={t("share.groupLabel")}
          description={t("share.groupLabel")}
          onClick={openMenu}
          isUIVisible={isUIVisible}
        />
        {isMenuOpen &&
          menuPos &&
          createPortal(
            <div
              className={styles.menuPopover}
              style={{ left: menuPos.left, top: menuPos.top }}
              data-share-menu="true"
              role="menu"
            >
              <button
                type="button"
                className={styles.menuItem}
                onClick={handleCopy}
                role="menuitem"
              >
                {renderCopyIcon()}
                <span>{copyLabel}</span>
              </button>
              {canNativeShare && (
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleNativeShare}
                  role="menuitem"
                >
                  <FontAwesomeIcon icon={faShareNodes} />
                  <span>{t("share.native")}</span>
                </button>
              )}
              {!canNativeShare && (
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleTwitter}
                  role="menuitem"
                >
                  {renderXIcon()}
                  <span>{t("share.x")}</span>
                </button>
              )}
              {!canNativeShare && (
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={handleLine}
                  role="menuitem"
                >
                  {renderLineIcon()}
                  <span>{t("share.line")}</span>
                </button>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }

  // インライン用: アイコン列（ページ下部メタ等）
  return (
    <div className={styles.row} role="group" aria-label={t("share.groupLabel")}>
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
          <FontAwesomeIcon icon={faShareNodes} />
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
