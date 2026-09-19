/**
 * SpotPins — 屏風の名所スポットピン（アノテーション）オーバーレイ。
 *
 * 親 section（position: relative）内に x / y%（スライス左上原点）でタグを重ねる。
 * Phase 1: 本文は持たず、クリックで該当段へスクロール＆コメンタリーバーを追従させる
 * （spots は sync が scenes[].spots を扇 index へ振り分けて各スライスに付与する）。
 *
 * パン操作との競合回避:
 * - 実体を button にし、useEmakiPalmDrag の isInteractive（a, button, [role=button]）に一致させる
 * - onPointerDown でも stopPropagation（親側ハンドラへの伝播を抑止）
 */
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SpotPins.module.css";
import { useRouter } from "next/router";
import { useContext } from "react";

const SpotPins = ({ spots, linkId }) => {
  const { handleToId } = useContext(AppContext);
  // 英語ロケールでは nameen を優先表示（未設定なら日本語 name へフォールバック）。
  // useLocale は重量データ（staticData / metadata-cache）を引き込むため router を直接参照する。
  const { locale } = useRouter();
  if (!spots?.length) return null;

  const spotLabel = (spot) =>
    locale === "en" && spot.nameen ? spot.nameen : spot.name;

  const goToScene = (e) => {
    e.stopPropagation();
    if (typeof handleToId === "function") handleToId(linkId);
  };

  // 扇の左右端のピンは、ラベルが自分のスライス（=スクロール枠の端）から
  // はみ出すとクリップされるため、transform の X 成分だけ内側へ寄せる。
  // 中央（10 < x < 90）は従来どおり -50%（点をアンカーに中央寄せ）。
  const pinTx = (x) => (x <= 10 ? "-15%" : x >= 90 ? "-85%" : "-50%");

  return (
    <div className={styles.layer}>
      {spots.map((spot) => {
        const label = spotLabel(spot);
        return (
          <button
            key={spot.id}
            type="button"
            className={styles.pin}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              "--pin-tx": pinTx(spot.x),
            }}
            title={label}
            aria-label={label}
            draggable={false}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={goToScene}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SpotPins;
