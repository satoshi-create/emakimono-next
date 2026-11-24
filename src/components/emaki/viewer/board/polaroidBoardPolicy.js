// =============================================================================
// ポラロイド＆ホワイトボード 権限・ルールポリシー＆純粋ヘルパー（Single Source of Truth）
// -----------------------------------------------------------------------------
// 個人ボード(personal)・共有URL(shared)・公開コラボボード(collab)および
// 将来のユーザー作成公開ボードにおける「誰が何をできるか」「どんなルールが適用されるか」と
// URL生成・ハブ解決・ストレージキー定数を1箇所に集約する。
// =============================================================================

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

export const BOARD_MODES = {
  PERSONAL: "personal",
  SHARED: "shared",
  COLLAB: "collab",
};

export const ODAI_RULE_MODES = {
  COOP: "coop", // 自由協力・寄せ書きモード
  UTAAWASE: "utaawase", // 歌合（紅白対抗・ベスト一句表彰）
  UNIQUE: "unique", // 場面かぶり禁止（重複警告バッジ）
};

export const BOARD_LIMITS = {
  MAX_COLLAB_ITEMS: 60,
};

/**
 * 現在のクライアント環境がボード管理者キーを保持しているか判定する
 */
export function isClientBoardAdmin() {
  if (typeof window === "undefined") return false;
  const expected = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY;
  if (!expected) return false;
  try {
    return window.localStorage.getItem("emakimono_board_admin_key") === expected;
  } catch {
    return false;
  }
}

/**
 * 現在のボード種別を正規化して返す
 */
export function resolveBoardMode({ isCollabMode = false, isSharedMode = false } = {}) {
  if (isCollabMode) return BOARD_MODES.COLLAB;
  if (isSharedMode) return BOARD_MODES.SHARED;
  return BOARD_MODES.PERSONAL;
}

/**
 * ボード説明文（description）に埋め込まれた `<!--odai:{...}-->` メタデータを安全に抽出する
 * 新しいルールプロパティを追加する場合も、この関数の返却値にデフォルト値を定義するだけで全体に反映される。
 */
export function parseOdaiMeta(description) {
  const defaultMeta = {
    mode: ODAI_RULE_MODES.COOP,
    prompt: "",
    onePerUser: false,
    targetCount: 0,
    allowedScrollIds: null, // 将来拡張: 特定絵巻限定ルール用
  };
  if (typeof description !== "string" || !description) {
    return defaultMeta;
  }
  const match = description.match(/<!--odai:(\{[\s\S]*?\})-->/);
  if (!match) {
    return defaultMeta;
  }
  try {
    const parsed = JSON.parse(match[1]);
    return {
      ...defaultMeta,
      ...parsed,
      mode: parsed.mode || ODAI_RULE_MODES.COOP,
      prompt: typeof parsed.prompt === "string" ? parsed.prompt : "",
      onePerUser: Boolean(parsed.onePerUser),
      targetCount: Number(parsed.targetCount) || 0,
      allowedScrollIds: Array.isArray(parsed.allowedScrollIds)
        ? parsed.allowedScrollIds
        : null,
    };
  } catch {
    return defaultMeta;
  }
}

/**
 * ボード全体に対する操作権限を算出する
 * 将来「ユーザーが自分の公開ボードを作成した場合（isBoardOwner = true）」の権限拡張もここで制御する。
 */
export function getBoardPermissions({
  isCollabMode = false,
  isSharedMode = false,
  isBoardAdmin = false,
  isBoardOwner = false,
} = {}) {
  const mode = resolveBoardMode({ isCollabMode, isSharedMode });

  if (mode === BOARD_MODES.SHARED) {
    return {
      mode,
      canPostItem: false,
      canEditBoardMeta: false,
      canCreateTheme: false,
      canDeleteBoard: false,
      canSaveCopyToPersonal: true,
      persistToLocalStorage: false,
    };
  }

  if (mode === BOARD_MODES.COLLAB) {
    const canManage = Boolean(isBoardAdmin || isBoardOwner);
    return {
      mode,
      canPostItem: true,
      canEditBoardMeta: canManage,
      canCreateTheme: canManage,
      canDeleteBoard: Boolean(isBoardAdmin),
      canSaveCopyToPersonal: false,
      persistToLocalStorage: false,
    };
  }

  // PERSONAL
  return {
    mode,
    canPostItem: true,
    canEditBoardMeta: true,
    canCreateTheme: true,
    canDeleteBoard: false,
    canSaveCopyToPersonal: false,
    persistToLocalStorage: true,
  };
}

/**
 * 個々のボードカード（item）に対する操作権限を算出する
 */
export function getBoardCardPermissions(
  { isCollabMode = false, isSharedMode = false, isBoardAdmin = false } = {},
  item = {}
) {
  const mode = resolveBoardMode({ isCollabMode, isSharedMode });

  if (mode === BOARD_MODES.SHARED) {
    return {
      canDrag: false,
      canEditMemo: false,
      canDelete: false,
      canLike: false,
    };
  }

  if (mode === BOARD_MODES.COLLAB) {
    const isAuthorOrAdmin = Boolean(isBoardAdmin || item.canEdit === true);
    return {
      canDrag: isAuthorOrAdmin,
      canEditMemo: isAuthorOrAdmin,
      canDelete: isAuthorOrAdmin,
      canLike: true,
    };
  }

  // PERSONAL
  return {
    canDrag: true,
    canEditMemo: true,
    canDelete: true,
    canLike: true,
  };
}

/**
 * お題ルール（utaawase / unique / coop）に基づき、全カードのルールバッジマップ（id -> badge）を算出する
 * 新しい対戦・協力ルールを追加する場合はここにケースを1つ追加するだけでカード表示へ反映される。
 */
export function computeCardRuleBadges(items = [], odaiMeta = null, isEn = false) {
  const badgeMap = new Map();
  if (!Array.isArray(items) || items.length === 0 || !odaiMeta) {
    return badgeMap;
  }

  const mode = odaiMeta.mode || ODAI_RULE_MODES.COOP;

  if (mode === ODAI_RULE_MODES.UTAAWASE) {
    const getTotalLikes = (it) =>
      (Number(it.likeCount) || 0) + (Array.isArray(it.likedIds) ? it.likedIds.length : 0);

    let maxLikes = 0;
    for (const it of items) {
      const total = getTotalLikes(it);
      if (total > maxLikes) maxLikes = total;
    }

    items.forEach((it, idx) => {
      const total = getTotalLikes(it);
      if (maxLikes > 0 && total === maxLikes) {
        badgeMap.set(it.id, {
          label: isEn ? "👑 Best Verse" : "👑 ベスト一句",
          bg: "#fef3c7",
          color: "#92400e",
          border: "#f59e0b",
        });
      } else if (idx % 2 === 0) {
        badgeMap.set(it.id, {
          label: isEn ? "🌸 Left Team" : "🌸 左方（紅組）",
          bg: "#ffe4e6",
          color: "#9f1239",
          border: "#fda4af",
        });
      } else {
        badgeMap.set(it.id, {
          label: isEn ? "🌊 Right Team" : "🌊 右方（白組）",
          bg: "#e0f2fe",
          color: "#075985",
          border: "#7dd3fc",
        });
      }
    });
    return badgeMap;
  }

  if (mode === ODAI_RULE_MODES.UNIQUE) {
    const counts = new Map();
    for (const it of items) {
      const key = String(it.displayChapter || it.displayTitle || "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const it of items) {
      const key = String(it.displayChapter || it.displayTitle || "").trim();
      if (key && (counts.get(key) || 0) >= 2) {
        badgeMap.set(it.id, {
          label: isEn ? "⚠️ Duplicate Scene" : "⚠️ かぶり中！",
          bg: "#fee2e2",
          color: "#991b1b",
          border: "#fca5a5",
        });
      }
    }
    return badgeMap;
  }

  return badgeMap;
}

/**
 * テーマ名・説明文から関連する絵巻ハブページ情報を解決する
 */
export function resolveRelatedThemeHub(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return null;

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

/**
 * ポラロイドカードから元絵巻の該当スポット（?slice=&cx=&cy=&cz=）へ戻るリンクを生成する
 */
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
      ? Math.round(Math.min(1.5, Math.max(1.2, item.cz)) * 10) / 10
      : Math.round(Math.min(1.5, Math.max(1.2, z)) * 10) / 10;

  params.set("cx", String(cx));
  params.set("cy", String(cy));
  params.set("cz", String(cz));

  const qs = params.toString();
  return qs ? `/${item.scrollId}?${qs}` : `/${item.scrollId}`;
}

export const BOARD_VIEWPORT_SESSION_PREFIX = "emakimono_polaroid_viewport_v1:";

export function buildBoardViewportStorageKey({ roomParam, personalParam, sharedParam }) {
  if (roomParam) return `${BOARD_VIEWPORT_SESSION_PREFIX}room:${roomParam}`;
  if (sharedParam) return `${BOARD_VIEWPORT_SESSION_PREFIX}shared:${sharedParam.slice(0, 48)}`;
  const personalId = personalParam || "default";
  return `${BOARD_VIEWPORT_SESSION_PREFIX}personal:${personalId}`;
}

export function loadBoardViewport(storageKey) {
  if (typeof window === "undefined" || !storageKey) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const x = Number(parsed?.x);
    const y = Number(parsed?.y);
    const scale = Number(parsed?.scale);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(scale)) return null;
    return {
      x: Math.round(x),
      y: Math.round(y),
      scale: Math.min(2.5, Math.max(0.35, Number(scale.toFixed(3)))),
    };
  } catch {
    return null;
  }
}

export function saveBoardViewport(storageKey, viewport) {
  if (typeof window === "undefined" || !storageKey || !viewport) return;
  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        x: Math.round(viewport.x),
        y: Math.round(viewport.y),
        scale: viewport.scale,
      })
    );
  } catch {
    // quota / private mode
  }
}