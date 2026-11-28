/**
 * 絵巻メタ data からスポット編集・パノラマストリップ用設定を1箇所で解決する。
 */
import {
  DEFAULT_SPOT_MASTERS,
  getRakuchuSpotKindClass,
} from "./rakuchuSpotPreset";

/**
 * @param {Record<string, unknown> | null | undefined} data 絵巻メタ（titleen / spots / panels 等）
 * @returns {{
 *   usePanoramaStrip: boolean,
 *   masterSpots: unknown[],
 *   getSpotKindClass: typeof getRakuchuSpotKindClass | undefined,
 * }}
 */
export function resolveScrollSpotConfig(data) {
  const titleen = String(data?.titleen || "");
  const isRakuchu = titleen.startsWith("rakuchu_rakugai");
  const hasPanelsPipeline =
    Array.isArray(data?.panels) && data.panels.length > 0;
  const usePanoramaStrip = Boolean(
    Array.isArray(data?.spots) || hasPanelsPipeline
  );

  let masterSpots = [];
  if (isRakuchu) {
    masterSpots = DEFAULT_SPOT_MASTERS;
  } else if (Array.isArray(data?.spotMasters)) {
    masterSpots = data.spotMasters;
  }

  const getSpotKindClass = isRakuchu ? getRakuchuSpotKindClass : undefined;

  return { usePanoramaStrip, masterSpots, getSpotKindClass };
}