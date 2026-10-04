/**
 * 絵引フローティング・ミニカード（スナックバー）。
 * 暗幕なし・pointer-events 分離で絵巻鑑賞を妨げない。
 */
import styles from "@/styles/FolkloreMiniCard.module.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "next-i18next";

const SCROLL_THUMB_FALLBACK = {
  naomoto_moushibumi_ekotoba: "/thumb/naomoto_moushibumi_ekotoba_thumb.webp",
  "eshi-no-soshi_tohaku": "/thumb/eshi-no-soshi_tohaku_thumb.webp",
  gakisoushi_kawamoto: "/thumb/gakisoushi_kawamoto_thumb.webp",
  "Chōjū-jinbutsu-giga_first": "/thumb/cyoujyuu_yamazaki_kou_thumb.webp",
  "Chōjū-jinbutsu-giga_third": "/thumb/cyoujyuu_yamazaki_hei_thumb.webp",
  "Chōjū-jinbutsu-giga_fourth": "/thumb/cyoujyuu_yamazaki_tei_thumb.webp",
};

const FolkloreMiniCard = ({ selectedItem, onOpenDetail, onClose, onActivity }) => {
  const { t, i18n } = useTranslation("common");
  const isEn = i18n.language === "en";
  const fallback =
    SCROLL_THUMB_FALLBACK[selectedItem?.titleen] ||
    "/thumb/naomoto_moushibumi_ekotoba_thumb.webp";
  const [thumbSrc, setThumbSrc] = useState(fallback);

  useEffect(() => {
    setThumbSrc(fallback);
    const crop = selectedItem?.crop_thumb;
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
  }, [selectedItem?.item_id, selectedItem?.crop_thumb, fallback]);

  const [portalTarget, setPortalTarget] = useState(null);
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    setPortalTarget(document.querySelector(".entry-container"));
  }, [selectedItem?.item_id]);

  if (!selectedItem || !portalTarget) return null;

  const bump = () => onActivity?.();
  const readMoreLabel = t("viewer.folkloreReadMore", {
    defaultValue: isEn ? "Read more 📖" : "詳しく読む 📖",
  });
  const closeLabel = t("viewer.folkloreMiniClose", {
    defaultValue: isEn ? "Close" : "閉じる",
  });

  return createPortal(
    <div
      className={styles.root}
      role="status"
      aria-live="polite"
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.thumb}
          src={thumbSrc}
          alt=""
          loading="lazy"
          onError={() => {
            if (thumbSrc !== fallback) setThumbSrc(fallback);
          }}
        />
        <div className={styles.body}>
          <div className={styles.meta}>
            {selectedItem.act_label ? (
              <span className={styles.tag}>{selectedItem.act_label}</span>
            ) : null}
            <h3 className={styles.title}>{selectedItem.name}</h3>
          </div>
          {selectedItem.summary ? (
            <p className={styles.summary}>{selectedItem.summary}</p>
          ) : null}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.detailBtn}
            onClick={() => {
              bump();
              onOpenDetail?.();
            }}
          >
            {readMoreLabel}
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => {
              bump();
              onClose?.();
            }}
            aria-label={closeLabel}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default FolkloreMiniCard;
