// =============================================================================
// デバッグスイッチ（検証完了後は false にして一括停止）
// =============================================================================
const DEBUG_SPOT_EDIT_SAVE = true;

function logDebug(tag, ...args) {
  if (!DEBUG_SPOT_EDIT_SAVE) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

function normalizeStoreSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/-/g, "_");
}

// =============================================================================
// 1. モジュールスコープ共有ストア（slug 単位の編集差分・新規スポット・スライス配置）
//    SpotPins 複数インスタンス間で pending / 配置モードを同期するため Map / Set で保持
// =============================================================================

/** @type {Map<string, Map<string, object>>} */
const pendingUpdatesBySlug = new Map();

/** @type {Map<string, Array<{ spotId: string, sliceIndex?: number, sliceImageName: string, name: string, nameen: string, x: number, y: number, rect: { w: number, h: number }, badgePos: object|null, isNew: true }>>} */
const addedSpotsBySlug = new Map();

/** @type {Map<string, Map<number, string[]>>} */
const sliceSpotIdsBySlug = new Map();

const pendingListeners = new Set();
const discardListeners = new Set();
const placeModeListeners = new Set();
const quizOnlyListeners = new Set();

let placeModeEnabled = false;
let quizOnlyEdit = false;

/** 一括保存バーの単一ホスト（開発 editSpots 時に1コンポーネントのみ表示） */
const editBarHostRef = { taken: false };

// =============================================================================
// 2. 内部通知（購読者へ再描画を促す）
// =============================================================================

const notifyPending = () => {
  pendingListeners.forEach((fn) => {
    fn();
  });
};

const notifyPlaceMode = () => {
  placeModeListeners.forEach((fn) => {
    fn();
  });
};

const notifyQuizOnly = () => {
  quizOnlyListeners.forEach((fn) => {
    fn();
  });
};

// =============================================================================
// 3. 購読 API — React 側は useEffect で登録・解除する
// =============================================================================

/** pending 件数・内容の変更を購読 */
export function subscribePendingUpdates(listener) {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
}

/** 配置モード on/off を購読 */
export function subscribePlaceMode(listener) {
  placeModeListeners.add(listener);
  return () => placeModeListeners.delete(listener);
}

/** クイズ枠のみ編集 on/off を購読 */
export function subscribeQuizOnly(listener) {
  quizOnlyListeners.add(listener);
  return () => quizOnlyListeners.delete(listener);
}

/** 破棄（discard）実行を購読 — 引数は slug */
export function subscribeDiscard(listener) {
  discardListeners.add(listener);
  return () => discardListeners.delete(listener);
}

// =============================================================================
// 4. 読み取り API — 表示・バリデーション用
// =============================================================================

/** slug に紐づく未保存パッチ Map（spotId → merged patch）。無ければ undefined */
export function getPendingUpdatesForSlug(slug) {
  const key = normalizeStoreSlug(slug);
  if (!key) return undefined;
  return pendingUpdatesBySlug.get(key);
}

/** 編集セッションで追加した新規スポット一覧 */
export function getAddedSpotsForSlug(slug) {
  const key = normalizeStoreSlug(slug);
  if (!key) return [];
  return addedSpotsBySlug.get(key) || [];
}

/** マスター JSON と追加スポットから、既に配置済みの spotId 集合を得る */
export function getPlacedSpotIdsForSlug(slug) {
  const key = normalizeStoreSlug(slug);
  const ids = new Set();
  const bySlice = sliceSpotIdsBySlug.get(key);
  if (bySlice) {
    bySlice.forEach((list) => list.forEach((id) => ids.add(id)));
  }
  (addedSpotsBySlug.get(key) || []).forEach((a) => ids.add(a.spotId));
  return ids;
}

/** マスター行が alias 含めいずれかの ID で既配置か */
export function isMasterSpotPlaced(master, placedIds) {
  const keys = [master.masterId, ...(master.aliasSpotIds || [])];
  return keys.some((id) => placedIds.has(id));
}

/** スライスごとの既存 spotId 一覧をストアへ登録（マウント時のシード） */
export function registerSliceSpotIds(slug, sliceIndex, spotIds) {
  const key = normalizeStoreSlug(slug);
  if (!key || !Number.isInteger(sliceIndex)) return;
  let bySlice = sliceSpotIdsBySlug.get(key);
  if (!bySlice) {
    bySlice = new Map();
    sliceSpotIdsBySlug.set(key, bySlice);
  }
  bySlice.set(sliceIndex, Array.isArray(spotIds) ? spotIds : []);
}

// =============================================================================
// 5. 配置モード・編集バーホスト
// =============================================================================

export function setPlaceModeEnabled(next) {
  placeModeEnabled = Boolean(next);
  notifyPlaceMode();
}

export function getPlaceModeEnabled() {
  return placeModeEnabled;
}

export function getQuizOnlyEdit() {
  return quizOnlyEdit;
}

export function setQuizOnlyEdit(next) {
  quizOnlyEdit = Boolean(next);
  notifyQuizOnly();
}

export function toggleQuizOnlyEdit() {
  quizOnlyEdit = !quizOnlyEdit;
  notifyQuizOnly();
}

/** 保存バー表示権を取得。既に他が保持していれば false */
export function claimEditBarHost() {
  if (editBarHostRef.taken) return false;
  editBarHostRef.taken = true;
  return true;
}

export function releaseEditBarHost() {
  editBarHostRef.taken = false;
}

// =============================================================================
// 6. pending マージ・新規スポット登録・クリア・破棄
// =============================================================================

export function mergePendingUpdate(slug, spotId, patch) {
  const key = normalizeStoreSlug(slug);
  if (!key || !spotId) return;
  const { stripBounds: _ignored, ...cleanPatch } = patch;
  let bySpot = pendingUpdatesBySlug.get(key);
  if (!bySpot) {
    bySpot = new Map();
    pendingUpdatesBySlug.set(key, bySpot);
  }
  const prev = bySpot.get(spotId) || {};
  const merged = { spotId, ...prev, ...cleanPatch };
  const preserveKeys = ["isNew", "sliceImageName", "sliceIndex", "name", "nameen"];
  preserveKeys.forEach((key) => {
    if (!(key in cleanPatch) && key in prev) merged[key] = prev[key];
  });
  bySpot.set(spotId, merged);
  logDebug("STORE:mergePending", {
    slug,
    spotId,
    patch: cleanPatch,
    after: merged,
  });
  notifyPending();
}

export function clearPendingForSlug(slug) {
  const key = normalizeStoreSlug(slug);
  if (key) pendingUpdatesBySlug.delete(key);
  notifyPending();
}

export function registerNewSpot(
  slug,
  {
    spotId,
    sliceIndex,
    sliceImageName,
    name,
    nameen,
    x = 50,
    y = 50,
  },
) {
  const key = normalizeStoreSlug(slug);
  if (!key || !spotId || !sliceImageName) return;
  const entry = {
    spotId,
    ...(Number.isInteger(sliceIndex) ? { sliceIndex } : {}),
    sliceImageName,
    name,
    nameen,
    x,
    y,
    rect: { w: 24, h: 20 },
    badgePos: null,
    isNew: true,
  };
  let list = addedSpotsBySlug.get(key);
  if (!list) {
    list = [];
    addedSpotsBySlug.set(key, list);
  }
  list.push(entry);
  mergePendingUpdate(key, spotId, {
    ...(Number.isInteger(sliceIndex) ? { sliceIndex } : {}),
    sliceImageName,
    name,
    nameen,
    x,
    y,
    rect: { w: 24, h: 20 },
    isNew: true,
  });
}

export function markSpotDeleted(slug, { spotId, sliceImageName, sliceIndex }) {
  const key = normalizeStoreSlug(slug);
  if (!key || !spotId) return;
  const added = addedSpotsBySlug.get(key);
  if (added) {
    const idx = added.findIndex(
      (a) => a.spotId === spotId && a.sliceImageName === sliceImageName,
    );
    if (idx !== -1) {
      added.splice(idx, 1);
      const bySpot = pendingUpdatesBySlug.get(key);
      if (bySpot) {
        bySpot.delete(spotId);
        if (bySpot.size === 0) pendingUpdatesBySlug.delete(key);
      }
      notifyPending();
      return;
    }
  }
  let bySpot = pendingUpdatesBySlug.get(key);
  if (!bySpot) {
    bySpot = new Map();
    pendingUpdatesBySlug.set(key, bySpot);
  }
  const deleteKey = `${spotId}::delete::${sliceImageName || sliceIndex || ""}`;
  bySpot.set(deleteKey, {
    spotId,
    sliceImageName,
    sliceIndex,
    deleted: true,
  });
  notifyPending();
}

export function isSpotMarkedDeleted(slug, spotId, sliceImageName) {
  const key = normalizeStoreSlug(slug);
  const bySpot = pendingUpdatesBySlug.get(key);
  if (!bySpot) return false;
  for (const u of bySpot.values()) {
    if (
      u.deleted === true &&
      u.spotId === spotId &&
      (!u.sliceImageName || !sliceImageName || u.sliceImageName === sliceImageName)
    ) {
      return true;
    }
  }
  return false;
}

export function discardPendingForSlug(slug) {
  const key = normalizeStoreSlug(slug);
  clearPendingForSlug(key);
  if (key) addedSpotsBySlug.delete(key);
  discardListeners.forEach((fn) => {
    fn(slug);
  });
}

// =============================================================================
// 7. API 一括保存 — 成功時のみ pending をクリアし結果オブジェクトを返す
// =============================================================================

export async function savePendingUpdatesToApi(
  rawSlug,
  endpoint = "/api/dev/update-spot",
) {
  const key = normalizeStoreSlug(rawSlug);
  const bySpot = pendingUpdatesBySlug.get(key);
  if (!key || !bySpot?.size) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "no pending updates",
    };
  }

  const allEntries = Array.from(bySpot.values());
  const quizUpdates = [];
  const spotUpdates = [];

  for (const patch of allEntries) {
    if (typeof patch.quizQuestionId === "string" && patch.quizQuestionId) {
      quizUpdates.push({
        questionId: patch.quizQuestionId,
        target: {
          x: patch.x,
          y: patch.y,
          ...(patch.rect ? { w: patch.rect.w, h: patch.rect.h } : {}),
          ...(Number.isFinite(patch.scale) ? { scale: patch.scale } : {}),
        },
      });
    } else {
      spotUpdates.push(patch);
    }
  }

  try {
    logDebug("STORE:saveRequest", { slug: key, quizUpdates, spotUpdates });

    if (quizUpdates.length > 0) {
      const quizRes = await fetch("/api/dev/update-quiz-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: key, updates: quizUpdates }),
      });

      let quizData = null;
      try {
        quizData = await quizRes.json();
      } catch {
        quizData = null;
      }

      logDebug("STORE:saveResponse", {
        kind: "quiz",
        status: quizRes.status,
        ok: quizRes.ok,
        body: quizData,
        ...(!quizRes.ok ? { errorKind: "http", payload: quizData } : {}),
      });

      if (!quizRes.ok) {
        return {
          ok: false,
          status: quizRes.status,
          data: quizData,
          error: `quiz save failed (${quizRes.status})`,
        };
      }
    }

    if (spotUpdates.length > 0) {
      const spotEndpoint = endpoint || "/api/dev/update-spot";
      const res = await fetch(spotEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: key, updates: spotUpdates }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      logDebug("STORE:saveResponse", {
        kind: "spot",
        status: res.status,
        ok: res.ok,
        body: data,
        ...(!res.ok ? { errorKind: "http", payload: data } : {}),
      });

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data,
          error: `save failed (${res.status})`,
        };
      }
    }

    clearPendingForSlug(key);

    return {
      ok: true,
      savedCount: quizUpdates.length + spotUpdates.length,
    };
  } catch (err) {
    logDebug("STORE:saveResponse", {
      status: 0,
      ok: false,
      body: null,
      errorKind: "network",
      payload: err?.message || String(err),
    });
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "save failed",
    };
  }
}