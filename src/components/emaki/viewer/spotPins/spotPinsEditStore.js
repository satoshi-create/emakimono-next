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

let placeModeEnabled = false;

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
  if (!slug) return undefined;
  return pendingUpdatesBySlug.get(slug);
}

/** 編集セッションで追加した新規スポット一覧 */
export function getAddedSpotsForSlug(slug) {
  if (!slug) return [];
  return addedSpotsBySlug.get(slug) || [];
}

/** マスター JSON と追加スポットから、既に配置済みの spotId 集合を得る */
export function getPlacedSpotIdsForSlug(slug) {
  const ids = new Set();
  const bySlice = sliceSpotIdsBySlug.get(slug);
  if (bySlice) {
    bySlice.forEach((list) => list.forEach((id) => ids.add(id)));
  }
  (addedSpotsBySlug.get(slug) || []).forEach((a) => ids.add(a.spotId));
  return ids;
}

/** マスター行が alias 含めいずれかの ID で既配置か */
export function isMasterSpotPlaced(master, placedIds) {
  const keys = [master.masterId, ...(master.aliasSpotIds || [])];
  return keys.some((id) => placedIds.has(id));
}

/** スライスごとの既存 spotId 一覧をストアへ登録（マウント時のシード） */
export function registerSliceSpotIds(slug, sliceIndex, spotIds) {
  if (!slug || !Number.isInteger(sliceIndex)) return;
  let bySlice = sliceSpotIdsBySlug.get(slug);
  if (!bySlice) {
    bySlice = new Map();
    sliceSpotIdsBySlug.set(slug, bySlice);
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
  if (!slug || !spotId) return;
  let bySpot = pendingUpdatesBySlug.get(slug);
  if (!bySpot) {
    bySpot = new Map();
    pendingUpdatesBySlug.set(slug, bySpot);
  }
  const prev = bySpot.get(spotId) || {};
  const merged = { spotId, ...prev, ...patch };
  const preserveKeys = ["isNew", "sliceImageName", "sliceIndex", "name", "nameen"];
  preserveKeys.forEach((key) => {
    if (!(key in patch) && key in prev) merged[key] = prev[key];
  });
  bySpot.set(spotId, merged);
  notifyPending();
}

export function clearPendingForSlug(slug) {
  if (slug) pendingUpdatesBySlug.delete(slug);
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
  if (!slug || !spotId || !sliceImageName) return;
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
  let list = addedSpotsBySlug.get(slug);
  if (!list) {
    list = [];
    addedSpotsBySlug.set(slug, list);
  }
  list.push(entry);
  mergePendingUpdate(slug, spotId, {
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

export function discardPendingForSlug(slug) {
  clearPendingForSlug(slug);
  if (slug) addedSpotsBySlug.delete(slug);
  discardListeners.forEach((fn) => {
    fn(slug);
  });
}

// =============================================================================
// 7. API 一括保存 — 成功時のみ pending をクリアし結果オブジェクトを返す
// =============================================================================

export async function savePendingUpdatesToApi(
  slug,
  endpoint = "/api/dev/update-spot",
) {
  const bySpot = pendingUpdatesBySlug.get(slug);
  if (!slug || !bySpot?.size) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "no pending updates",
    };
  }

  const updates = Array.from(bySpot.values());

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, updates }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `save failed (${res.status})`,
      };
    }

    clearPendingForSlug(slug);

    return {
      ok: true,
      status: res.status,
      data,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "save failed",
    };
  }
}