/**
 * useSpotLayout — 名所バッジの実測 px ベース退避レイアウト。
 *
 * SpotPins 本体から切り出した計測ロジック。DOM の offsetWidth / layer clientWidth と
 * ResizeObserver・Web フォント確定を元実装どおり扱う。
 */
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import {
  BADGE_GAP,
  EDGE_MARGIN,
  fallbackOffset,
} from "./spotPinsGeometry";

// =============================================================================
// 1. フック公開 API — 計測対象 DOM 参照とスポット一覧を受け取り offsets を返す
// =============================================================================

/**
 * @param {object} options
 * @param {React.RefObject<HTMLElement>} options.layerRef — スライス幅 W / 高さ H の基準層
 * @param {React.MutableRefObject<Map<string, HTMLElement>>} options.badgeRefs — 各スポットのバッジ（ピン）要素 Map
 * @param {React.MutableRefObject<Map<string, HTMLElement>>} [options.guideRefs] — ガイド線 DOM（将来拡張用・現計測では未使用）
 * @param {Array<{ id: string, x: number, y: number }>} options.mergedSpots
 * @param {Record<string, { x?: number, y?: number }>} options.dragOverrides
 * @param {(spot: object) => string} options.spotLabel — ロケール連動の再測定トリガー兼ラベル解決（SpotPins 互換）
 * @param {string} [options.locale] — JA/EN 切替時の useLayoutEffect 依存（元 SpotPins と同一）
 */
export function useSpotLayout({
  layerRef,
  badgeRefs,
  guideRefs,
  mergedSpots,
  dragOverrides,
  spotLabel,
  locale,
}) {
  void guideRefs;
  void spotLabel;

  const [offsets, setOffsets] = useState({});
  const offsetRef = useRef({});

  // =============================================================================
  // 2. 実測 — 基準点 (X,Y) 左上にバッジを置き、端ではみ出すときだけ反対側へ退避
  // =============================================================================

  const measure = useCallback(() => {
    const layer = layerRef.current;
    const W = layer ? layer.clientWidth : 0;
    const H = layer ? layer.clientHeight : 0;
    if (!W || !H) return;
    const next = {};
    const prev = offsetRef.current;
    (mergedSpots || []).forEach((spot) => {
      const sx = dragOverrides[spot.id]?.x ?? spot.x;
      const sy = dragOverrides[spot.id]?.y ?? spot.y;
      const el = badgeRefs.current.get(spot.id);
      const w = el ? el.offsetWidth : 0;
      const h = el ? el.offsetHeight : 0;
      if (!w || !h) {
        const fb = prev[spot.id] ?? fallbackOffset(sx, sy);
        next[spot.id] = {
          ...fb,
          guideX: -BADGE_GAP,
          guideY: -BADGE_GAP,
        };
        return;
      }
      const X = (W * sx) / 100;
      const Y = (H * sy) / 100;
      let offsetX = `calc(-100% - ${BADGE_GAP}px)`;
      if (X - w - BADGE_GAP < EDGE_MARGIN) {
        offsetX = `calc(0% + ${BADGE_GAP}px)`;
      }
      let offsetY = `calc(-100% - ${BADGE_GAP}px)`;
      if (Y - h - BADGE_GAP < EDGE_MARGIN) {
        offsetY = `calc(0% + ${BADGE_GAP}px)`;
      }
      const guideX = offsetX.startsWith("calc(-100%")
        ? -BADGE_GAP
        : w + BADGE_GAP;
      const guideY = offsetY.startsWith("calc(-100%")
        ? -BADGE_GAP
        : h + BADGE_GAP;
      next[spot.id] = { offsetX, offsetY, guideX, guideY };
    });
    const changed =
      Object.keys(next).length !== Object.keys(prev).length ||
      Object.keys(next).some((k) => {
        const a = prev[k];
        const b = next[k];
        return (
          !a ||
          !b ||
          a.offsetX !== b.offsetX ||
          a.offsetY !== b.offsetY
        );
      });
    offsetRef.current = next;
    if (changed) setOffsets(next);
  }, [mergedSpots, dragOverrides, layerRef, badgeRefs]);

  // =============================================================================
  // 3. サブスクリプション — リサイズ・フォント確定・ロケール変更で再測定
  // =============================================================================

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

  return { offsets, remeasure: measure };
}