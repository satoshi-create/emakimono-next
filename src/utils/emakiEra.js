/**
 * 時代表示ヘルパー（純関数・依存なし）。
 *
 * - eraColor: 時代名 → 色
 * - eraNameEn: eraen（内部コード: heiann / kamakura 等）→ 英語表示名
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import { getEraColorTokens } from "@/theme/colorMode";

export const eraColor = (x) => getEraColorTokens(x).badgeBg;

// eraen（内部コード: heiann / kamakura / muromachi / aduchimomoyama / edo / meiji）を
// 英語表示名へ変換する。データの eraen は URL スラグ用途の小文字コードのため、
// 表示にはこのマッピングを使う。
export const eraNameEn = (eraen) => {
  const map = {
    heiann: "Heian",
    kamakura: "Kamakura",
    muromachi: "Muromachi",
    aduchimomoyama: "Azuchi–Momoyama",
    edo: "Edo",
    meiji: "Meiji",
    medieval: "Medieval",
    "northern-song": "Northern Song",
  };
  return map[eraen] || eraen;
};