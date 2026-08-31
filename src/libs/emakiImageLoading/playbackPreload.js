import {
  PLAYBACK_DECODE_BATCH_PER_IDLE,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";
import {
  buildEmakiCloudinaryImageUrl,
  computeEmakiDeliveryWidth,
} from "@/libs/emakiImageLoading/deliveryUrl";

/** 同一 URL の二重 preload を抑止（セッション内） */
const preloadedUrls = new Set();
const preloadLinkEls = [];

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

const enqueueDecode = (img) => {
  decodeQueue.push(() => {
    if (typeof img.decode === "function") {
      img.decode().catch(() => {});
    }
  });
  scheduleDecodeDrain();
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

const warmImageCache = (url) => {
  const img = new Image();
  img.src = url;
  enqueueDecode(img);
};

/**
 * 再生中の先読み: LazyImage / next/image と同一 URL でキャッシュを温める。
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
  lookahead = PLAYBACK_IMAGE_LOOKAHEAD
) => {
  if (!processedEmakis?.length || fromSceneIndex == null) return;

  const { toggleFullscreen = false, orientation = "landscape" } = viewport;
  const maxScene = fromSceneIndex + lookahead;

  processedEmakis.forEach((item, sceneIndex) => {
    if (item.cat !== "image" || !item.src) return;
    if (sceneIndex < fromSceneIndex || sceneIndex > maxScene) return;

    const deliveryWidth = computeEmakiDeliveryWidth({
      srcWidth: item.srcWidth,
      srcHeight: item.srcHeight,
      toggleFullscreen,
      orientation,
    });
    const url = buildEmakiCloudinaryImageUrl(item.src, deliveryWidth);

    if (preloadedUrls.has(url)) return;
    preloadedUrls.add(url);

    injectPreloadLink(url);
    warmImageCache(url);
  });
};

/** 絵巻切替時に preload キャッシュをクリア */
export const clearPlaybackPreloadCache = () => {
  preloadedUrls.clear();
  decodeQueue.length = 0;
  decodeIdleScheduled = false;
  preloadLinkEls.forEach((el) => el.remove());
  preloadLinkEls.length = 0;
};
