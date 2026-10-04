/**
 * EbikiCoordinatePicker — 絵引座標の目視クリックピッカー（開発専用・第1段階）。
 *
 * 有効条件: NODE_ENV === "development" かつ ?dev=ebiki または ?ebikiPicker=1
 * ズーム中（isZoomed）は座標が狂うため無効。
 *
 * - useEbikiCoordinatePicker: 有効判定・onPick・HUD 状態
 * - EbikiPickerOverlay: 各 section#scene-N 上の透明クリック層（SpotPins と同安全設計）
 * - EbikiCoordinatePickerHud: 左下 HUD（CSV 貼付用テキスト表示）
 */
import styles from "@/styles/EbikiCoordinatePicker.module.css";
import { triggerEbikiSpotlight } from "@/utils/triggerEbikiSpotlight";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";

/** URL クエリでピッカーが要求されているか */
export function isEbikiPickerQuery(query) {
  if (!query) return false;
  return query.dev === "ebiki" || query.ebikiPicker === "1";
}

/**
 * クリック座標 → offset_percent（0=右端, 100=左端, 小数第1位）。
 */
export function calcOffsetPercentFromClick(clientX, sectionEl) {
  if (!sectionEl) return null;
  const rect = sectionEl.getBoundingClientRect();
  if (!rect.width) return null;
  const leftPct = ((clientX - rect.left) / rect.width) * 100;
  const offsetPercent = Math.min(
    100,
    Math.max(0, Math.round((100 - leftPct) * 10) / 10)
  );
  return {
    offsetPercent,
    leftPct: Math.round(leftPct * 10) / 10,
  };
}

/**
 * Conteiner から呼ぶ。enabled / onPick / hud を返す。
 * プレビュースクロールは realign: false（ResizeObserver 巻き戻り回避）。
 */
export function useEbikiCoordinatePicker({ handleToId, isZoomed = false } = {}) {
  const router = useRouter();
  const [hudData, setHudData] = useState(null);

  const enabled =
    process.env.NODE_ENV === "development" &&
    isEbikiPickerQuery(router.query) &&
    !isZoomed;

  const onPick = useCallback(
    ({ linkId, offsetPercent, leftPct }) => {
      triggerEbikiSpotlight(linkId, offsetPercent);
      if (typeof handleToId === "function") {
        handleToId(linkId, {
          realign: false,
          offsetPercent,
          behavior: "smooth",
        });
      }

      const csvLine = `${offsetPercent},${linkId}`;
      const labelLine = `link_id: ${linkId}, offset_percent: ${offsetPercent}`;
      setHudData({ linkId, offsetPercent, leftPct, csvLine, labelLine });

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        // 表計算へそのまま貼れる TSV（offset_percent \t link_id）
        navigator.clipboard
          .writeText(`${offsetPercent}\t${linkId}`)
          .catch(() => {});
      }
    },
    [handleToId]
  );

  const clearHud = useCallback(() => setHudData(null), []);

  return { enabled, onPick, hudData, clearHud };
}

/** セクション上の透明オーバーレイ（SwitcherEmaki 内にマウント） */
export function EbikiPickerOverlay({ linkId, onPick }) {
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const section = e.currentTarget.closest("section");
    if (!section) return;
    const coords = calcOffsetPercentFromClick(e.clientX, section);
    if (!coords) return;
    onPick?.({
      linkId,
      offsetPercent: coords.offsetPercent,
      leftPct: coords.leftPct,
    });
  };

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={`絵引座標ピッカー scene-${linkId}`}
      className={styles.overlay}
      draggable={false}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleClick}
    >
      <span className={styles.badge} aria-hidden="true">
        scene-{linkId}
      </span>
    </div>
  );
}

/** 画面左下のトースト HUD */
export function EbikiCoordinatePickerHud({ hudData, onClose }) {
  if (!hudData) return null;

  return (
    <div className={styles.hud} role="status" aria-live="polite">
      <button
        type="button"
        className={styles.hudClose}
        aria-label="閉じる"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        ×
      </button>
      <div className={styles.hudTitle}>絵引 座標ピッカー</div>
      <div className={styles.hudRow}>
        link_id: <strong>{hudData.linkId}</strong>
      </div>
      <div className={styles.hudRow}>
        offset_percent: <strong>{hudData.offsetPercent}</strong>
        <span style={{ opacity: 0.55 }}> (leftPct {hudData.leftPct})</span>
      </div>
      <div className={styles.hudCsv}>{hudData.labelLine}</div>
      <div className={styles.hudCsv}>CSV: {hudData.csvLine}</div>
      <div className={styles.hudHint}>クリップボードへ TSV をコピー済み</div>
    </div>
  );
}
