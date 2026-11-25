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
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
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
 * @param {"menu"|"inline"|"iconCopy"|"share"} [props.variant="inline"]
 *   - iconCopy: コピーのみ（アイコン）
 *   - share: 共有のみ（コピーなし。ネイティブ or X/LINE）
 *   - inline: コピー＋共有
 *   - menu: ナビ用ポップオーバー（現行は未使用寄り）
 */
const ShareButtons = ({
  navIndex = 0,
  emakiId = "",
  shareTitle = "",
  variant = "inline",
  isUIVisible = true,
  tone = "default",
  openPolaroidModal,
  spotId = "",
}) => {
  const { locale, locales, asPath, defaultLocale } = useRouter();
  const { t } = useTranslation("common");
  const [isCopied, setIsCopied] = useState(false);
  const [isTextLinkCopied, setIsTextLinkCopied] = useState(false);
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

  const shareUrl = useMemo(() => {
    const base = buildShareUrl({
      locale,
      asPath,
      locales,
      defaultLocale,
      navIndex,
    });
    const id = spotId ? String(spotId).trim() : "";
    if (!id) return base;
    const joiner = base.includes("?") ? "&" : "?";
    return `${base}${joiner}spot=${encodeURIComponent(id)}`;
  }, [locale, asPath, locales, defaultLocale, navIndex, spotId]);

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

  const handleCopyTextAndUrl = async () => {
    try {
      const shareContent = shareTitle
        ? `${shareTitle}\n${shareUrl}`
        : shareUrl;
      await navigator.clipboard.writeText(shareContent);
      setIsTextLinkCopied(true);
      setTimeout(() => {
        setIsTextLinkCopied(false);
        setIsMenuOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle || t("header.siteTitle"),
        text: shareTitle || t("header.siteTitle"),
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

  const polaroidLabel = t("polaroid.title");
  const isJa = locale === "ja";
  const isEnLocale = !isJa;
  const polaroidBtnRef = useRef(null);
  const [showPolaroidTip, setShowPolaroidTip] = useState(false);
  const [polaroidTipPos, setPolaroidTipPos] = useState(null);

  useEffect(() => {
    if (!openPolaroidModal || typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem("emakimono_polaroid_tip_seen_v1");
      if (!seen) {
        setShowPolaroidTip(true);
      }
    } catch {}
  }, [openPolaroidModal]);

  useEffect(() => {
    if (!showPolaroidTip || typeof window === "undefined") return;
    const updateTipPos = () => {
      const el = polaroidBtnRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const centerX = rect.left + rect.width / 2;
      const clampedX = Math.max(120, Math.min(window.innerWidth - 120, centerX));
      setPolaroidTipPos({
        left: clampedX,
        top: rect.top - 10,
        arrowOffset: centerX - clampedX,
      });
    };
    updateTipPos();
    const rafId = window.requestAnimationFrame(updateTipPos);
    window.addEventListener("resize", updateTipPos);
    window.addEventListener("scroll", updateTipPos, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateTipPos);
      window.removeEventListener("scroll", updateTipPos, true);
    };
  }, [showPolaroidTip]);

  const dismissPolaroidTip = (e) => {
    if (e) e.stopPropagation();
    setShowPolaroidTip(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("emakimono_polaroid_tip_seen_v1", "1");
      } catch {}
    }
  };

  const renderPolaroidButton = (className) =>
    openPolaroidModal ? (
      <>
        <button
          ref={polaroidBtnRef}
          type="button"
          onClick={() => {
            dismissPolaroidTip();
            openPolaroidModal();
          }}
          className={className}
          title={polaroidLabel}
          aria-label={polaroidLabel}
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        {showPolaroidTip &&
          polaroidTipPos &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              role="tooltip"
              style={{
                position: "fixed",
                left: `${polaroidTipPos.left}px`,
                top: `${polaroidTipPos.top}px`,
                transform: "translate(-50%, -100%)",
                zIndex: 9999,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "8px",
                backgroundColor: "#5c431d",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: 1.35,
                whiteSpace: "nowrap",
                boxShadow: "0 6px 16px rgba(15, 23, 42, 0.25)",
                pointerEvents: "auto",
              }}
            >
              <span>
                {isEnLocale
                  ? "📷 Clip this scene to a board!"
                  : "📷 ここから場面を切り抜けます！"}
              </span>
              <button
                type="button"
                onClick={dismissPolaroidTip}
                aria-label="Close tooltip"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "11px",
                  padding: "0 2px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: `calc(50% + ${polaroidTipPos.arrowOffset || 0}px)`,
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #5c431d",
                }}
              />
            </div>,
            document.body
          )}
      </>
    ) : null;

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
              <button
                type="button"
                onClick={handleCopyTextAndUrl}
                role="menuitem"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.75rem",
                  color: isTextLinkCopied ? "#15803d" : "#374151",
                  backgroundColor: isTextLinkCopied
                    ? "rgba(34, 197, 94, 0.08)"
                    : "transparent",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s ease",
                }}
              >
                <span>{isTextLinkCopied ? "✓" : "📋"}</span>
                <span>
                  {isTextLinkCopied
                    ? isJa
                      ? "コピーしました！"
                      : "Copied!"
                    : isJa
                      ? "文面とリンクをコピー"
                      : "Copy text & link"}
                </span>
              </button>
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
              {openPolaroidModal && (
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    openPolaroidModal();
                    setIsMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  <FontAwesomeIcon className={styles.menuIcon} icon={faCamera} />
                  <span>{polaroidLabel}</span>
                </button>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }

  // コピーのみ（解説バー・縦書き段タイトル用・アイコンのみ）
  if (variant === "iconCopy" || variant === "cta") {
    return (
      <button
        type="button"
        className={`${styles.iconBtn} ${
          tone === "light" ? styles.iconBtnLight : ""
        } ${isCopied ? styles.iconCopied : ""}`}
        onClick={handleCopy}
        title={copyLabel}
        aria-label={copyLabel}
      >
        {renderCopyIcon()}
      </button>
    );
  }

  // 共有のみ（絵巻タイトル横・段タイトル・コピーなし）
  if (variant === "share") {
    const btnClass = `${styles.iconBtn} ${
      tone === "light" ? styles.iconBtnLight : ""
    }`;
    return (
      <div className={styles.row} role="group" aria-label={t("share.groupLabel")}>
        {canNativeShare ? (
          <button
            type="button"
            className={btnClass}
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
              className={btnClass}
              onClick={handleTwitter}
              title={t("share.xDesc")}
              aria-label={t("share.xDesc")}
            >
              {renderXIcon()}
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={handleLine}
              title={t("share.lineDesc")}
              aria-label={t("share.lineDesc")}
            >
              {renderLineIcon()}
            </button>
          </>
        )}
        {renderPolaroidButton(btnClass)}
      </div>
    );
  }

  // インライン用: コピー＋共有（後方互換）
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
      {renderPolaroidButton(styles.iconBtn)}
    </div>
  );
};

export default ShareButtons;
