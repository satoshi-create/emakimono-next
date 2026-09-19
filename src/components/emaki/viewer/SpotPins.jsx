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
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// 端ピンがスライス境界から離す最低セーフマージン（px）。
// CSS .layer の --spot-edge-inset と同値に保つこと。
const EDGE_MARGIN = 4;

// 未測定時のフォールバック（CLS 回避）。端寄りのピンは先に内側基準へ寄せておく。
const fallbackTx = (x) => (x <= 30 ? "0" : x >= 70 ? "-100%" : "-50%");

const SpotPins = ({ spots, linkId }) => {
  // chapterToggle はフッターの「段タイトルを非表示」トグル（AppContext 正本）。
  // 屏風では段タイトル枠が無いため、このフラグを名所スポットピンの表示に流用する。
  // SpotPins は spots 保持スライス（＝屏風）にのみ描画されるので通常絵巻に影響しない。
  const { handleToId, chapterToggle } = useContext(AppContext);
  // 英語ロケールでは nameen を優先表示（未設定なら日本語 name へフォールバック）。
  // useLocale は重量データ（staticData / metadata-cache）を引き込むため router を直接参照する。
  const { locale } = useRouter();
  // 実測用: layer（=スライス幅 W）と各ピン button（=ラベル実幅 w）
  const layerRef = useRef(null);
  const pinRefs = useRef(new Map());
  const [txById, setTxById] = useState({});
  const txRef = useRef({});

  // 実測 px ベースのクランプ:
  //   アンカー物理位置 X = W * x/100 に対し、ピン実幅 w が左右の枠を割るかを判定し
  //   transform の X 成分（基点）を 0 / -100% / -50% から選ぶ。
  //   固定 % 判定と違いフォントサイズ・言語（JA/EN）・画面幅・ズーム倍率に追従する。
  const measure = useCallback(() => {
    const layer = layerRef.current;
    const W = layer ? layer.clientWidth : 0;
    if (!W) return;
    const next = {};
    const prev = txRef.current;
    (spots || []).forEach((spot) => {
      const el = pinRefs.current.get(spot.id);
      const w = el ? el.offsetWidth : 0;
      if (!w) {
        // 未測定（ref 未接続など）: 直前値を維持し、無ければ安全なフォールバック
        next[spot.id] = prev[spot.id] ?? fallbackTx(spot.x);
        return;
      }
      const X = (W * spot.x) / 100;
      if (X - w / 2 < EDGE_MARGIN) next[spot.id] = "0"; // 左端: 右側へ展開
      else if (X + w / 2 > W - EDGE_MARGIN) next[spot.id] = "-100%"; // 右端: 左側へ
      else next[spot.id] = "-50%"; // 枠内: 中央揃え
    });
    // 変化が無ければ再レンダリングしない（再測定の無限ループ防止）
    const changed =
      Object.keys(next).length !== Object.keys(prev).length ||
      Object.keys(next).some((k) => prev[k] !== next[k]);
    txRef.current = next;
    if (changed) setTxById(next);
  }, [spots]);

  useLayoutEffect(() => {
    measure();
    const layer = layerRef.current;
    if (!layer || typeof ResizeObserver === "undefined") return undefined;
    // リサイズ・回転・全画面切替（スライス幅の変化）で再測定
    const ro = new ResizeObserver(() => measure());
    ro.observe(layer);
    // Web フォント確定でラベル幅が変わるケースを拾う
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => ro.disconnect();
    // locale 変更（JA/EN でラベル幅が変わる）でも再測定する
  }, [measure, locale]);

  if (!spots?.length) return null;

  const spotLabel = (spot) =>
    locale === "en" && spot.nameen ? spot.nameen : spot.name;

  const goToScene = (e) => {
    e.stopPropagation();
    if (typeof handleToId === "function") handleToId(linkId);
  };

  // ピンの基点は measure() が実測値から決定する（--pin-tx）。
  return (
    // chapterToggle=false（段タイトル非表示）でピンをフェードアウト＋操作不可にする。
    <div
      ref={layerRef}
      className={`${styles.layer}${chapterToggle ? "" : ` ${styles.hidden}`}`}
    >
      {spots.map((spot) => {
        const label = spotLabel(spot);
        return (
          <button
            key={spot.id}
            ref={(el) => {
              if (el) pinRefs.current.set(spot.id, el);
              else pinRefs.current.delete(spot.id);
            }}
            type="button"
            className={styles.pin}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              "--pin-tx": txById[spot.id] ?? fallbackTx(spot.x),
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
