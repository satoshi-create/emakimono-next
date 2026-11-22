// =============================================================================
// ポラロイド＆ホワイトボード 権限・ルールポリシー（Single Source of Truth）
// -----------------------------------------------------------------------------
// 個人ボード(personal)・共有URL(shared)・公開コラボボード(collab)および
// 将来のユーザー作成公開ボードにおける「誰が何をできるか」「どんなルールが適用されるか」を
// 1箇所に集約し、UIコンポーネントやAPIから一貫して参照できるようにする。
// =============================================================================

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
    const isAuthorOrAdmin = Boolean(isBoardAdmin || item.canEdit !== false);
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