import {
  BYOBU_HUB_PATH,
  CHOUJU_GIGA_HUB_PATH,
  HYAKKI_HUB_PATH,
  KUSOUZU_HUB_PATH,
  RAKUCHU_RAKUGAI_HUB_PATH,
} from "@/libs/constants/links";
import { getAllHubPages } from "@/libs/hubPages";

export const ACTIVE_COLLAB_ROOM_KEY = "emakimono_active_collab_room_v1";
export const AUTHOR_NAME_KEY = "emakimono_polaroid_author_v1";

export function resolveRelatedThemeHub(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return null;

  // 1. hubPages.json 内の動的追加ハブ（!isBuiltin）を優先照合
  const allHubs = getAllHubPages();
  for (const hub of allHubs) {
    if (hub.isBuiltin) continue;
    const titleJa = String(hub.titleJa || "").replace(/一覧$/, "").toLowerCase();
    const titleEn = String(hub.titleEn || "").toLowerCase();
    const kws = Array.isArray(hub.keywords)
      ? hub.keywords.map((k) => String(k).toLowerCase()).filter(Boolean)
      : [];
    if (
      (titleJa && s.includes(titleJa)) ||
      (titleEn && s.includes(titleEn)) ||
      kws.some((kw) => s.includes(kw))
    ) {
      return {
        path: hub.path,
        labelJa: hub.titleJa,
        labelEn: hub.titleEn || hub.titleJa,
      };
    }
  }

  // 2. 既存の組み込みハブ照合
  if (/鳥獣|choju|chouju/.test(s)) {
    return { path: CHOUJU_GIGA_HUB_PATH, labelJa: "鳥獣人物戯画一覧", labelEn: "Chōjū-giga" };
  }
  if (/百鬼|付喪神|hyakki|tsukumogami/.test(s)) {
    return { path: HYAKKI_HUB_PATH, labelJa: "百鬼夜行・付喪神一覧", labelEn: "Hyakki Yagyō" };
  }
  if (/九相|kusozu|kusouzu/.test(s)) {
    return { path: KUSOUZU_HUB_PATH, labelJa: "九相図一覧", labelEn: "Kusōzu" };
  }
  if (/洛中|rakuchu/.test(s)) {
    return { path: RAKUCHU_RAKUGAI_HUB_PATH, labelJa: "洛中洛外図一覧", labelEn: "Rakuchū-rakugai-zu" };
  }
  if (/屏風|byobu/.test(s)) {
    return { path: BYOBU_HUB_PATH, labelJa: "屏風一覧", labelEn: "Byōbu Screens" };
  }
  return null;
}

export function buildSourceHref(item) {
  const params = new URLSearchParams();
  if (typeof item.sceneIndex === "number" && item.sceneIndex >= 0) {
    params.set("slice", String(item.sceneIndex));
  }
  const z = typeof item.zoom === "number" && item.zoom > 0 ? item.zoom : 1.5;
  const cs = typeof item.coverScale === "number" && item.coverScale > 0 ? item.coverScale : 1;
  const estW = 960 * cs * z;
  const estH = 960 * cs * z;
  const cx =
    typeof item.cx === "number" && Number.isFinite(item.cx)
      ? item.cx
      : Math.round(Math.min(100, Math.max(0, 50 - ((item.pan?.x || 0) / estW) * 100)) * 10) / 10;
  const cy =
    typeof item.cy === "number" && Number.isFinite(item.cy)
      ? item.cy
      : Math.round(Math.min(100, Math.max(0, 50 - ((item.pan?.y || 0) / estH) * 100)) * 10) / 10;
  const cz =
    typeof item.cz === "number" && Number.isFinite(item.cz)
      ? item.cz
      : Math.round(Math.min(4.6, Math.max(1.2, z)) * 100) / 100;

  params.set("cx", String(cx));
  params.set("cy", String(cy));
  params.set("cz", String(cz));

  const qs = params.toString();
  return qs ? `/${item.scrollId}?${qs}` : `/${item.scrollId}`;
}
