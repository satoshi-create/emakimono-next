/**
 * 絵引詳細シート（ハーフモーダル／ボトムシート）。
 * 宮本常一の論考 + 神奈川大学『絵引』DB 書誌を表示する。
 */
import styles from "@/styles/FolkloreDetailSheet.module.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

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
  const [cropExpanded, setCropExpanded] = useState(false);

  useEffect(() => {
    setThumbSrc(fallback);
    setCropExpanded(false);
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

  if (!open || !item) return null;

  const { miyamoto, ebiki } = item;
  const bump = () => onActivity?.();

  return (
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
        aria-modal="true"
        aria-labelledby="folklore-sheet-title"
        onMouseEnter={bump}
        onTouchStart={bump}
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

        {thumbSrc ? (
          <div className={styles.cropWrap}>
            <button
              type="button"
              className={styles.cropBtn}
              onClick={() => setCropExpanded((v) => !v)}
              aria-expanded={cropExpanded}
              aria-label={cropExpanded ? "サムネイルを縮小" : "サムネイルを拡大"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc}
                alt=""
                className={`${styles.cropImg} ${
                  cropExpanded ? styles.cropImgExpanded : ""
                }`}
                loading="lazy"
                onError={() => {
                  if (thumbSrc !== fallback) setThumbSrc(fallback);
                }}
              />
            </button>
            <p className={styles.cropCaption}>絵巻上のこの場所</p>
          </div>
        ) : null}

        <div className={styles.meta}>
          {item.act_label ? (
            <span className={styles.tag}>{item.act_label}</span>
          ) : null}
          {item.era ? <span className={styles.tagMuted}>{item.era}</span> : null}
        </div>

        <div className={styles.body}>
          {item.summary ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>概要</h3>
              <p className={styles.prose}>{item.summary}</p>
            </section>
          ) : null}

          {miyamoto?.insight ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>宮本常一の論考</h3>
              {miyamoto.chapter_title ? (
                <p className={styles.citeTitle}>{miyamoto.chapter_title}</p>
              ) : null}
              <blockquote className={styles.quote}>{miyamoto.insight}</blockquote>
              {miyamoto.page_ref ? (
                <p className={styles.source}>出典: {miyamoto.page_ref}</p>
              ) : null}
            </section>
          ) : null}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>絵引データベース</h3>
            <dl className={styles.dl}>
              {ebiki?.title ? (
                <>
                  <dt>項目</dt>
                  <dd>{ebiki.title}</dd>
                </>
              ) : null}
              {ebiki?.original_emaki ? (
                <>
                  <dt>原画絵巻</dt>
                  <dd>{ebiki.original_emaki}</dd>
                </>
              ) : null}
              {ebiki?.volume || ebiki?.page || ebiki?.number ? (
                <>
                  <dt>巻・頁・番号</dt>
                  <dd>
                    {[
                      ebiki.volume ? `巻${ebiki.volume}` : null,
                      ebiki.page ? `p.${ebiki.page}` : null,
                      ebiki.number ? `No.${ebiki.number}` : null,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </dd>
                </>
              ) : null}
              {ebiki?.artist ? (
                <>
                  <dt>絵師</dt>
                  <dd>{ebiki.artist}</dd>
                </>
              ) : null}
              {ebiki?.location ? (
                <>
                  <dt>地域</dt>
                  <dd>{ebiki.location}</dd>
                </>
              ) : null}
            </dl>
            {ebiki?.url ? (
              <p className={styles.extLinkWrap}>
                <a
                  href={ebiki.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.extLink}
                >
                  神奈川大学日本常民文化研究所『絵引』原画DBで見る
                </a>
                <span className={styles.attribution}>
                  出典: 神奈川大学日本常民文化研究所『絵巻物による日本常民生活絵引』データベース
                </span>
              </p>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
};

export default FolkloreDetailSheet;
