/**
 * 時代カラーモード × ビューアモード（emaki / byobu）の一元管理基盤。
 */
import { isByobuScroll } from "@/utils/isByobuScroll";

// 1. 時代ごとのカラートークン定義（badgeBg は既存 eraColor 後方互換用）
export const ERA_COLOR_MODES = {
  heian: {
    badgeBg: "#ff8c77",
    accent: "#ff8c77",
    text: "#c8523b",
    softBg: "rgba(255, 140, 119, 0.12)",
    border: "rgba(255, 140, 119, 0.45)",
  },
  kamakura: {
    badgeBg: "#54896a",
    accent: "#54896a",
    text: "#3d6b50",
    softBg: "rgba(84, 137, 106, 0.12)",
    border: "rgba(84, 137, 106, 0.45)",
  },
  muromachi: {
    badgeBg: "purple",
    accent: "#7e57c2",
    text: "#5e35b1",
    softBg: "rgba(126, 87, 194, 0.12)",
    border: "rgba(126, 87, 194, 0.45)",
  },
  azuchimomoyama: {
    badgeBg: "gold",
    accent: "#c69214",
    text: "#9a6f08",
    softBg: "rgba(198, 146, 20, 0.13)",
    border: "rgba(198, 146, 20, 0.45)",
  },
  edo: {
    badgeBg: "skyblue",
    accent: "#3b82b6",
    text: "#256394",
    softBg: "rgba(59, 130, 182, 0.12)",
    border: "rgba(59, 130, 182, 0.45)",
  },
  meiji: {
    badgeBg: "firebrick",
    accent: "#b23a3a",
    text: "#8f2828",
    softBg: "rgba(178, 58, 58, 0.12)",
    border: "rgba(178, 58, 58, 0.45)",
  },
  default: {
    badgeBg: undefined,
    accent: "#8a6d3b",
    text: "#6e552b",
    softBg: "rgba(138, 109, 59, 0.11)",
    border: "rgba(138, 109, 59, 0.4)",
  },
};

// 2. 日本語・英語・スラッグを正規化してモードキーへ
export function resolveEraModeKey(eraOrEraEn) {
  if (eraOrEraEn == null || eraOrEraEn === "") return "default";
  const raw = String(eraOrEraEn).trim();
  const lower = raw.toLowerCase().replace(/[–—]/g, "-");

  switch (raw) {
    case "平安":
      return "heian";
    case "鎌倉":
      return "kamakura";
    case "室町":
      return "muromachi";
    case "安土・桃山":
      return "azuchimomoyama";
    case "江戸":
      return "edo";
    case "明治":
      return "meiji";
    default:
      break;
  }

  switch (raw) {
    case "Heian":
      return "heian";
    case "Kamakura":
      return "kamakura";
    case "Muromachi":
      return "muromachi";
    case "Azuchi–Momoyama":
    case "Azuchi-Momoyama":
      return "azuchimomoyama";
    case "Edo":
      return "edo";
    case "Meiji":
      return "meiji";
    default:
      break;
  }

  if (lower === "heian" || lower === "heiann") return "heian";
  if (lower === "kamakura") return "kamakura";
  if (lower === "muromachi") return "muromachi";
  if (
    lower === "azuchimomoyama" ||
    lower === "aduchimomoyama" ||
    lower === "azuchi-momoyama"
  ) {
    return "azuchimomoyama";
  }
  if (lower === "edo") return "edo";
  if (lower === "meiji") return "meiji";

  return "default";
}

// 3. モードキーに対応するトークンオブジェクト
export function getEraColorTokens(eraOrEraEn) {
  const key = resolveEraModeKey(eraOrEraEn);
  return ERA_COLOR_MODES[key] || ERA_COLOR_MODES.default;
}

// 4. 絵巻データからビューアレイアウトモードを判定
export function resolveViewerMode(data) {
  return isByobuScroll(data) ? "byobu" : "emaki";
}

// 5. DOM style 用 CSS 変数オブジェクトを組み立て
export function buildViewerThemeStyle(data) {
  const eraSource = data?.era ?? data?.eraen;
  const tokens = getEraColorTokens(eraSource);
  return {
    "--era-accent": tokens.accent,
    "--era-text": tokens.text,
    "--era-soft-bg": tokens.softBg,
    "--era-border": tokens.border,
    "--accent-color": tokens.accent,
    "--clr-link": tokens.text,
  };
}