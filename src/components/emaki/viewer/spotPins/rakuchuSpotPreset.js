/**
 * 洛中洛外図（rakuchu-rakugai）向けスポットピンのデフォルト依存を SpotPins 本体から切り出したプリセット。
 * 他絵巻では masterSpots / getSpotKindClass を親から渡し、このモジュールに直接依存しない想定。
 */

// =============================================================================
// 1. 名所マスタ — 洛中洛外のデフォルト spots 一覧
// =============================================================================

import {
  getSpotVisualKind,
  RAKUCHU_SPOT_MASTERS,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

/** SpotPins の `masterSpots` デフォルト値（RAKUCHU_SPOT_MASTERS の別名） */
export const DEFAULT_SPOT_MASTERS = RAKUCHU_SPOT_MASTERS;

// =============================================================================
// 2. ピン見た目 — motif 種別に応じた CSS Module クラス
// =============================================================================

/**
 * getSpotKindClass 未指定時の洛中洛外デフォルト: spot.id から視覚種別を判定し pin* クラスを返す。
 * @param {{ id?: string } | null | undefined} spot
 * @param {{ pinPower?: string, pinTemple?: string, pinWater?: string, pinTown?: string }} styles
 * @returns {string}
 */
export function getRakuchuSpotKindClass(spot, styles) {
  const kind = getSpotVisualKind(spot?.id);
  if (kind === "power") return styles.pinPower ?? "";
  if (kind === "temple") return styles.pinTemple ?? "";
  if (kind === "water") return styles.pinWater ?? "";
  if (kind === "town") return styles.pinTown ?? "";
  return "";
}