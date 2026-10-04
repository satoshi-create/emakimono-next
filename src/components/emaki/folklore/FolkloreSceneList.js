/**
 * 現在段の絵引アイテム一覧（段一覧と同型のサムネ＋テキストリスト）。
 * SceneCommentaryBar 内で viewMode === "ebiki" のとき本文とスワップ表示する。
 */
import styles from "@/styles/FolkloreSceneList.module.css";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const SCROLL_THUMB_FALLBACK = {
  naomoto_moushibumi_ekotoba: "/thumb/naomoto_moushibumi_ekotoba_thumb.webp",
  "eshi-no-soshi_tohaku": "/thumb/eshi-no-soshi_tohaku_thumb.webp",
  gakisoushi_kawamoto: "/thumb/gakisoushi_kawamoto_thumb.webp",
  "Chōjū-jinbutsu-giga_first": "/thumb/cyoujyuu_yamazaki_kou_thumb.webp",
  "Chōjū-jinbutsu-giga_third": "/thumb/cyoujyuu_yamazaki_hei_thumb.webp",
  "Chōjū-jinbutsu-giga_fourth": "/thumb/cyoujyuu_yamazaki_tei_thumb.webp",
};

const normalizeThumbSrc = (src) => {
  if (!src || typeof src !== "string") return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  // 先頭スラッシュ欠落の相対パスを補正
  if (trimmed.startsWith("assets/")) return `/${trimmed}`;
  return trimmed;
};

const FolkloreItemThumb = ({ item, sceneThumb, alt }) => {
  const candidates = useMemo(() => {
    const scrollFb =
      SCROLL_THUMB_FALLBACK[item.titleen] ||
      "/thumb/naomoto_moushibumi_ekotoba_thumb.webp";
    return [
      ...new Set(
        [normalizeThumbSrc(item.crop_thumb), sceneThumb, scrollFb].filter(
          Boolean
        )
      ),
    ];
  }, [item.crop_thumb, item.titleen, sceneThumb]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [item.item_id, candidates]);
  const src = candidates[Math.min(idx, candidates.length - 1)];

  if (!src) {
    return <span className={styles.thumb} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.thumb}
      src={src}
      alt={alt || ""}
      loading="lazy"
      onError={() => {
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
    />
  );
};

const FolkloreSceneList = ({
  items = [],
  sceneThumb = null,
  onSelect,
  onActivity,
  ariaLabel,
}) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  if (!items.length) return null;

  const bump = () => onActivity?.();
  const listAria = ariaLabel || t("viewer.folkloreListAria");

  return (
    <nav
      className={styles.list}
      aria-label={listAria}
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      {items.map((item) => {
        const displayName =
          isEn && item.name_en ? item.name_en : item.name;
        const displayActLabel =
          isEn && item.act_label_en ? item.act_label_en : item.act_label;
        const displaySummary =
          isEn && item.summary_en ? item.summary_en : item.summary;

        return (
          <button
            key={item.item_id}
            type="button"
            className={styles.item}
            onClick={(e) => {
              e.stopPropagation();
              bump();
              // スクロール＋シート表示は親 handleFolkloreSelect（handleToId）に委譲
              onSelect?.(item);
            }}
          >
            <FolkloreItemThumb
              item={item}
              sceneThumb={sceneThumb}
              alt={displayName}
            />
            <span className={styles.text}>
              <span className={styles.titleRow}>
                <span className={styles.name}>{displayName}</span>
                {displayActLabel ? (
                  <span className={styles.tag}>{displayActLabel}</span>
                ) : null}
              </span>
              {displaySummary ? (
                <span className={styles.summary}>{displaySummary}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default FolkloreSceneList;
