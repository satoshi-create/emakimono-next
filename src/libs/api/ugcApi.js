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
async function requestJson(url, { ignore503 = true, ...fetchOptions } = {}) {
  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => ({}));

  if (!res.ok && !(ignore503 && res.status === 503)) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

function getJson(url, options) {
  return requestJson(url, options);
}

function postJson(url, body, options) {
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