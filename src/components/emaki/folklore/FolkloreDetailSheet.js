/**
 * 絵引詳細シート（画面右上フローティング・スリム版）。
 * 暗幕なし・pointer-events 分離で絵巻鑑賞を妨げない。
 * 鑑賞中は要点のみ表示し、論考・DB詳細は絵引ポータルへ誘導する。
 */
import styles from "@/styles/FolkloreDetailSheet.module.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SCROLL_THUMB_FALLBACK = {
  naomoto_moushibumi_ekotoba: "/thumb/naomoto_moushibumi_ekotoba_thumb.webp",
  "eshi-no-soshi_tohaku": "/thumb/eshi-no-soshi_tohaku_thumb.webp",
  gakisoushi_kawamoto: "/thumb/gakisoushi_kawamoto_thumb.webp",
  "Chōjū-jinbutsu-giga_first": "/thumb/cyoujyuu_yamazaki_kou_thumb.webp",
  "Chōjū-jinbutsu-giga_third": "/thumb/cyoujyuu_yamazaki_hei_thumb.webp",
  "Chōjū-jinbutsu-giga_fourth": "/thumb/cyoujyuu_yamazaki_tei_thumb.webp",
};

const FolkloreDetailSheet = ({ item, open, onClose, onActivity }) => {
  const fallback =
    SCROLL_THUMB_FALLBACK[item?.titleen] ||
    "/thumb/naomoto_moushibumi_ekotoba_thumb.webp";
  const [thumbSrc, setThumbSrc] = useState(fallback);

  useEffect(() => {
    setThumbSrc(fallback);
    const crop = item?.crop_thumb;
    if (!crop || crop === fallback) return undefined;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setThumbSrc(crop);
    };
    probe.src = crop;
    return () => {
      cancelled = true;
    };
  }, [item?.item_id, item?.crop_thumb, fallback]);

  useEffect(() => {
    if (!open) return undefined;
    onActivity?.();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onActivity]);

  if (!open || !item || typeof document === "undefined") return null;

  const bump = () => onActivity?.();
  const portalHref = item.item_id
    ? `/ebiki?item=${encodeURIComponent(item.item_id)}`
    : "/ebiki";

  // SceneCommentaryBar の transform 配下だと fixed 基準がずれるため body へ退避
  return createPortal(
    <div
      className={styles.root}
      role="presentation"
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="閉じる"
        onClick={onClose}
      />
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="false"
        aria-labelledby="folklore-sheet-title"
        onMouseEnter={bump}
        onTouchStart={bump}
        onWheel={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h2 id="folklore-sheet-title" className={styles.title}>
              {item.name}
            </h2>
            {item.reading ? (
              <p className={styles.reading}>{item.reading}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="閉じる"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div
          className={styles.sheetContent}
          onWheel={(e) => e.stopPropagation()}
        >
          {thumbSrc ? (
            <div className={styles.cropWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc}
                alt=""
                className={styles.compactThumb}
                loading="lazy"
                onError={() => {
                  if (thumbSrc !== fallback) setThumbSrc(fallback);
                }}
              />
            </div>
          ) : null}

          <div className={styles.meta}>
            {item.act_label && item.act_category ? (
              <Link href={`/ebiki?category=${encodeURIComponent(item.act_category)}`}>
                <a className={styles.tagLink} onClick={onClose}>
                  {item.act_label}
                </a>
              </Link>
            ) : item.act_label ? (
              <span className={styles.tag}>{item.act_label}</span>
            ) : null}
            {item.era ? <span className={styles.tagMuted}>{item.era}</span> : null}
          </div>

          {item.summary ? (
            <section className={styles.summarySection}>
              <h3 className={styles.sectionTitle}>概要</h3>
              <p className={styles.summaryText}>{item.summary}</p>
            </section>
          ) : null}

          <div className={styles.footerLink}>
            <Link href={portalHref}>
              <a className={styles.hubLink} onClick={onClose}>
                絵引ポータルで詳細・論考を見る →
              </a>
            </Link>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
};

export default FolkloreDetailSheet;
