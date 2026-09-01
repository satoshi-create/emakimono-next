import {
  PLAYBACK_DECODE_BATCH_PER_IDLE,
  PLAYBACK_DOM_PRELOAD_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";
import {
  buildEmakiCloudinaryImageUrl,
  computeEmakiDeliveryWidth,
} from "@/libs/emakiImageLoading/deliveryUrl";

/** 同一 URL の二重 preload を抑止（セッション内） */
const preloadedUrls = new Set();
const preloadLinkEls = [];

/** url → decode 完了 Promise */
const decodePromises = new Map();
/** 同期的に decode 済みか判定（PlaybackImage の初期 state 用） */
const resolvedDecodeUrls = new Set();

const decodeQueue = [];
let decodeIdleScheduled = false;

const scheduleDecodeDrain = () => {
  if (decodeIdleScheduled || decodeQueue.length === 0) return;
  decodeIdleScheduled = true;

  const drain = () => {
    decodeIdleScheduled = false;
    let batch = PLAYBACK_DECODE_BATCH_PER_IDLE;
    while (batch > 0 && decodeQueue.length > 0) {
      const job = decodeQueue.shift();
      job?.();
      batch -= 1;
    }
    if (decodeQueue.length > 0) scheduleDecodeDrain();
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(drain, { timeout: 1000 });
  } else {
    setTimeout(drain, 16);
  }
};

const markDecodeResolved = (url, resolve) => {
  resolvedDecodeUrls.add(url);
  resolve();
};

/**
 * preload と LazyImage 再生表示で同一 URL を生成する。
 *
 * @param {{ src?: string; srcWidth?: number; srcHeight?: number }} item
 * @param {{ toggleFullscreen?: boolean; orientation?: string }} [viewport]
 * @returns {string | null}
 */
export const buildPlaybackImageUrl = (item, viewport = {}) => {
  if (!item?.src) return null;

  const { toggleFullscreen = false, orientation = "landscape" } = viewport;
  const deliveryWidth = computeEmakiDeliveryWidth({
    srcWidth: item.srcWidth,
    srcHeight: item.srcHeight,
    toggleFullscreen,
    orientation,
  });
  return buildEmakiCloudinaryImageUrl(item.src, deliveryWidth);
};

const warmImageCache = (url) => {
  if (decodePromises.has(url)) {
    return decodePromises.get(url);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      decodeQueue.push(() => {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(() => markDecodeResolved(url, resolve))
            .catch(() => markDecodeResolved(url, resolve));
        } else {
          markDecodeResolved(url, resolve);
        }
      });
      scheduleDecodeDrain();
    };
    img.onerror = () => markDecodeResolved(url, resolve);
    img.src = url;
  });

  decodePromises.set(url, promise);
  return promise;
};

/** decode 完了を待つ（未 preload の URL は即 resolve） */
export const waitForPlaybackDecode = (url) =>
  decodePromises.get(url) ?? Promise.resolve();

/** decode 済みか（同期的） */
export const isPlaybackImageDecoded = (url) => resolvedDecodeUrls.has(url);

/**
 * 単一シーンの preload + decode を開始（未登録 URL のみ）。
 * DOM window 進入時に decode 完了を待ってからマウントする用途。
 */
export const ensurePlaybackImagePreloaded = (item, viewport = {}) => {
  const url = buildPlaybackImageUrl(item, viewport);
  if (!url) return Promise.resolve();
  if (!preloadedUrls.has(url)) {
    preloadedUrls.add(url);
    injectPreloadLink(url);
  }
  return warmImageCache(url);
};

/**
 * 再生中の先読み: LazyImage 再生表示と同一 URL でキャッシュを温める。
 *
 * @param {Array<{ cat?: string; src?: string; srcWidth?: number; srcHeight?: number }>} processedEmakis
 * @param {number} fromSceneIndex
 * @param {{ toggleFullscreen?: boolean; orientation?: string }} [viewport]
 * @param {number} [lookahead]
 */
export const preloadPlaybackImages = (
  processedEmakis,
  fromSceneIndex,
  viewport = {},
  lookahead = PLAYBACK_DOM_PRELOAD_LOOKAHEAD
) => {
  if (!processedEmakis?.length || fromSceneIndex == null) return;

  const maxScene = fromSceneIndex + lookahead;

  processedEmakis.forEach((item, sceneIndex) => {
    if (item.cat !== "image" || !item.src) return;
    if (sceneIndex < fromSceneIndex || sceneIndex > maxScene) return;

    const url = buildPlaybackImageUrl(item, viewport);
    if (!url || preloadedUrls.has(url)) return;

    preloadedUrls.add(url);
    injectPreloadLink(url);
    warmImageCache(url);
  });
};

const injectPreloadLink = (url) => {
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  document.head.appendChild(link);
  preloadLinkEls.push(link);
};

/** 絵巻切替時に preload キャッシュをクリア */
export const clearPlaybackPreloadCache = () => {
  preloadedUrls.clear();
  decodePromises.clear();
  resolvedDecodeUrls.clear();
  decodeQueue.length = 0;
  decodeIdleScheduled = false;
  preloadLinkEls.forEach((el) => el.remove());
  preloadLinkEls.length = 0;
};
