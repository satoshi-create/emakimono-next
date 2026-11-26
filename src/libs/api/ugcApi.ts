/**
 * Turso バックエンド連携 UGC API 用クライアントヘルパー
 */

// =============================================================================
// 1. 共通 JSON リクエスト基盤
// =============================================================================

/**
 * JSON API への共通 fetch ラッパ
 * @param {string} url
 * @param {RequestInit & { ignore503?: boolean }} [options]
 */
type RequestJsonOptions = RequestInit & { ignore503?: boolean };

async function requestJson(
  url: string,
  { ignore503 = true, ...fetchOptions }: RequestJsonOptions = {}
): Promise<Record<string, unknown>> {
  const res = await fetch(url, fetchOptions);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok && !(ignore503 && res.status === 503)) {
    const message =
      typeof data.message === "string" ? data.message : undefined;
    throw new Error(message || `Request failed (${res.status})`);
  }

  return data;
}

function getJson(url: string, options?: RequestJsonOptions) {
  return requestJson(url, options);
}

function postJson(
  url: string,
  body: Record<string, unknown>,
  options?: RequestJsonOptions
) {
  return requestJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });
}

// =============================================================================
// 2. いいね API クライアント（絵巻単位・シーン単位）
// =============================================================================

export async function postEmakiLike(emakiId) {
  try {
    return await postJson("/api/likes/emaki", { emakiId });
  } catch (error) {
    console.warn("postEmakiLike:", error.message);
    return null;
  }
}

export async function postSceneLike({ emakiId, sceneIndex, action }) {
  try {
    return await postJson("/api/likes/scene", {
      emakiId,
      sceneIndex,
      action,
    });
  } catch (error) {
    console.warn("postSceneLike:", error.message);
    return null;
  }
}

export async function fetchSceneLikeCounts(emakiId) {
  try {
    return await getJson(
      `/api/likes/scene?emakiId=${encodeURIComponent(emakiId)}`
    );
  } catch (error) {
    console.warn("fetchSceneLikeCounts:", error.message);
    return null;
  }
}

// =============================================================================
// 3. 読後フィードバック API クライアント
// =============================================================================

export async function postScrollFeedback({
  emakiId,
  choice,
  sceneIndex,
  scrollRatio,
  locale,
}) {
  return postJson(
    "/api/feedback/scroll",
    {
      emakiId,
      choice,
      sceneIndex,
      scrollRatio,
      locale,
    },
    { ignore503: false }
  );
}

// =============================================================================
// 4. ポラロイド・コラボホワイトボード API クライアント
// =============================================================================

export async function fetchPublicBoards() {
  return requestJson("/api/board", { method: "GET" });
}

export async function createCollabBoard({
  title,
  description = "",
  visibility = "unlisted",
  authorName,
  items = [],
}: {
  title?: string;
  description?: string;
  visibility?: string;
  authorName?: string;
  items?: unknown[];
} = {}) {
  return requestJson("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, visibility, authorName, items }),
    ignore503: false,
  });
}

export async function fetchCollabBoard(boardId) {
  const clientId = getOrCreatePolaroidClientId();
  const adminKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("emakimono_board_admin_key") || ""
      : "";
  const headers = {};
  if (clientId) headers["x-board-client-id"] = clientId;
  if (adminKey) headers["x-board-admin-key"] = adminKey;
  return requestJson(`/api/board/${encodeURIComponent(boardId)}`, {
    method: "GET",
    headers,
    ignore503: false,
  });
}

export async function updateCollabBoardTitle(boardId, title) {
  return requestJson(`/api/board/${encodeURIComponent(boardId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
    ignore503: false,
  });
}

export async function updateCollabBoardMeta(boardId, payload) {
  return requestJson(`/api/board/${encodeURIComponent(boardId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ignore503: false,
  });
}

function getOrCreatePolaroidClientId() {
  if (typeof window === "undefined") return "";
  const key = "emakimono_polaroid_client_id_v1";
  try {
    let cid = window.localStorage.getItem(key);
    if (!cid) {
      cid = `cid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, cid);
    }
    return cid;
  } catch {
    return "";
  }
}

export async function addCollabBoardItem(boardId, item) {
  const clientId = getOrCreatePolaroidClientId();
  const adminKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("emakimono_board_admin_key") || ""
      : "";
  const headers = { "Content-Type": "application/json" };
  if (adminKey) {
    headers["x-board-admin-key"] = adminKey;
  }

  return requestJson(`/api/board/${encodeURIComponent(boardId)}/items`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...item,
      clientId: item?.clientId || clientId,
    }),
    ignore503: false,
  });
}

export async function updateCollabBoardItem(boardId, payload) {
  const clientId = getOrCreatePolaroidClientId();
  const headers = buildBoardAuthHeaders(
    { "Content-Type": "application/json" },
    clientId
  );
  return requestJson(`/api/board/${encodeURIComponent(boardId)}/items`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ ...payload, clientId }),
    ignore503: false,
  });
}

function buildBoardAuthHeaders(
  baseHeaders: Record<string, string> = {},
  explicitClientId?: string
): Record<string, string> {
  const headers: Record<string, string> = { ...baseHeaders };
  const clientId = explicitClientId ?? getOrCreatePolaroidClientId();
  const adminKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("emakimono_board_admin_key") || ""
      : "";
  if (clientId) headers["x-board-client-id"] = clientId;
  if (adminKey) headers["x-board-admin-key"] = adminKey;
  return headers;
}

export async function deleteCollabBoardItem(boardId, itemId) {
  const headers = buildBoardAuthHeaders();
  return requestJson(
    `/api/board/${encodeURIComponent(boardId)}/items?itemId=${encodeURIComponent(
      itemId
    )}`,
    {
      method: "DELETE",
      headers,
      ignore503: false,
    }
  );
}

export async function toggleCollabBoardItemLike(boardId, itemId, likeDelta) {
  return requestJson(
    `/api/board/${encodeURIComponent(boardId)}/items`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, likeDelta }),
      ignore503: false,
    }
  );
}