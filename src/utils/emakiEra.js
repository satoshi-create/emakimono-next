/**
 * 時代表示ヘルパー（純関数・依存なし）。
 *
 * - eraColor: 時代名 → 色
 * - eraNameEn: eraen（内部コード: heiann / kamakura 等）→ 英語表示名
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
export const eraColor = (x) => {
  switch (x) {
    case "平安":
    case "Heian":
      return "#ff8c77";
      break;
    case "鎌倉":
    case "Kamakura":
      return "#54896a";
      break;
    case "室町":
    case "Muromachi":
      return "purple";
      break;
    case "安土・桃山":
    case "Azuchi–Momoyama":
      return "gold";
      break;
    case "江戸":
    case "Edo":
      return "skyblue";
      break;
    case "明治":
    case "Meiji":
      return "firebrick";
      break;
    default:
      break;
  }
};

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
  };
  return map[eraen] || eraen;
};
