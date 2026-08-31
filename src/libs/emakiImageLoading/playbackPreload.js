import {
  PLAYBACK_DECODE_BATCH_PER_IDLE,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

/** 同一 URL の二重 preload を抑止（セッション内） */
const preloadedUrls = new Set();

const decodeQueue = [];
let decodeIdleScheduled = false;

const DEFAULT_WIDTH = 1200;

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

/**
 * 再生中の先読み: scene index ベースで Cloudinary 画像を decode まで試行。
 * LazyImage の memo 再レンダーなしでキャッシュを温める。
 *
 * @param {Array<{ cat?: string; src?: string; srcWidth?: number }>} processedEmakis
 * @param {number} fromSceneIndex
 * @param {number} [lookahead]
 */
export const preloadPlaybackImages = (
  processedEmakis,
  fromSceneIndex,
  lookahead = PLAYBACK_IMAGE_LOOKAHEAD
) => {
  if (!processedEmakis?.length || fromSceneIndex == null) return;

  const maxScene = fromSceneIndex + lookahead;

  processedEmakis.forEach((item, sceneIndex) => {
    if (item.cat !== "image" || !item.src) return;
    if (sceneIndex < fromSceneIndex || sceneIndex > maxScene) return;

    const width = item.srcWidth
      ? Math.min(item.srcWidth, DEFAULT_WIDTH)
      : DEFAULT_WIDTH;
    const url = buildCloudinaryUrl(item.src, [
      `w_${width}`,
      "f_auto",
      "q_auto:eco",
    ]);

    if (preloadedUrls.has(url)) return;
    preloadedUrls.add(url);

    const img = new Image();
    img.src = url;
    enqueueDecode(img);
  });
};

/** 絵巻切替時に preload キャッシュをクリア */
export const clearPlaybackPreloadCache = () => {
  preloadedUrls.clear();
  decodeQueue.length = 0;
  decodeIdleScheduled = false;
};
