/**
 * Client helpers for Turso-backed UGC API routes.
 */

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 503) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return res.json().catch(() => ({}));
}

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

export async function postFeedback({ message, pageUrl, emakiId, locale }) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, pageUrl, emakiId, locale }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}
