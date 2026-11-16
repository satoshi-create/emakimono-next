import { getSpotVisualKind } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { getMotifByMasterId } from "./wingLinks";

export const SPOT_KIND_THEME = {
  power: {
    borderColor: "#4b2e83",
    accentColor: "#4b2e83",
    textColor: "#361f63",
    bg: "rgba(252, 250, 255, 0.96)",
    pillBg: "#efeaf9",
    dotStyle: {
      width: 8,
      height: 8,
      borderRadius: 1,
      backgroundColor: "#4b2e83",
    },
  },
  temple: {
    borderColor: "#b83227",
    accentColor: "#b83227",
    textColor: "#8f2219",
    bg: "rgba(255, 251, 250, 0.96)",
    pillBg: "#fbeae8",
    dotStyle: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: "#b83227",
    },
  },
  water: {
    borderColor: "#1d6fa5",
    accentColor: "#1d6fa5",
    textColor: "#12486b",
    bg: "rgba(243, 250, 255, 0.96)",
    pillBg: "#e4f2fb",
    dotStyle: {
      width: 10,
      height: 6,
      borderRadius: 999,
      backgroundColor: "#1d6fa5",
    },
  },
  town: {
    borderColor: "#9c6615",
    accentColor: "#c58b2a",
    textColor: "#7a4f0e",
    bg: "rgba(255, 252, 242, 0.96)",
    pillBg: "#f8efd9",
    dotStyle: {
      width: 7,
      height: 7,
      borderRadius: 1,
      transform: "rotate(45deg)",
      backgroundColor: "#c58b2a",
    },
  },
};

export function themeForKind(kind) {
  return SPOT_KIND_THEME[kind] || SPOT_KIND_THEME.town;
}

export function categoryFilterTheme(filterId) {
  if (filterId === "all") return SPOT_KIND_THEME.town;
  return themeForKind(filterId);
}

export function buildNamedSpotPin(masterId, visual, locale) {
  if (!masterId || !visual) return null;
  const motif = getMotifByMasterId(masterId);
  if (!motif) return null;
  const isJa = locale !== "en";
  const kind =
    (typeof getSpotVisualKind === "function"
      ? getSpotVisualKind(masterId)
      : null) ||
    motif.category ||
    "town";
  const theme = themeForKind(kind);
  return {
    label: isJa ? motif.nameJa : motif.nameEn,
    cx: visual.x,
    cy: visual.y,
    borderColor: theme.borderColor,
    bg: theme.bg,
    textColor: theme.textColor,
    dotStyle: theme.dotStyle,
  };
}