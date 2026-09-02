/** Playback Surface 用: decode 済み画像キャッシュ（uniqueIndex キー） */

const cache = new Map();

/**
 * @param {number | string} key — 通常 `img-${uniqueIndex}`
 * @returns {string | null}
 */
export function getPlaybackImageDisplayUrl(key) {
  const entry = cache.get(key);
  return entry?.ready ? entry.url : null;
}

/**
 * @param {number | string} key
 * @param {string} url
 * @returns {Promise<string | null>}
 */
export function prefetchPlaybackImage(key, url) {
  if (key == null || !url) return Promise.resolve(null);

  const existing = cache.get(key);
  if (existing?.ready && existing.url === url) {
    return Promise.resolve(url);
  }
  if (existing?.promise && existing.url === url) {
    return existing.promise;
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        /* decode 失敗時も表示試行 */
      }
      cache.set(key, { url, ready: true });
      resolve(url);
    };
    img.onerror = () => {
      cache.set(key, { url, ready: false });
      resolve(null);
    };
    img.src = url;
  });

  cache.set(key, { url, ready: false, promise });
  return promise;
}

export function clearPlaybackImageCache() {
  cache.clear();
}

export function cacheKeyForSegment(seg) {
  if (seg?.uniqueIndex == null) return null;
  return `img-${seg.uniqueIndex}`;
}
