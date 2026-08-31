import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { PLAYBACK_MAX_DELIVERY_WIDTH } from "@/libs/constants/viewerPlayback";

/** next/image 12 デフォルト（next.config 未指定時） */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

const snapToDeviceSize = (width) => {
  for (let i = 0; i < DEVICE_SIZES.length; i += 1) {
    if (width <= DEVICE_SIZES[i]) return DEVICE_SIZES[i];
  }
  return DEVICE_SIZES[DEVICE_SIZES.length - 1];
};

/** LazyImage の getResponsiveHeightVar と同じ vh 換算 */
export const getEmakiDisplayHeightPx = (toggleFullscreen, orientation) => {
  if (typeof window === "undefined") return 600;
  const vh = window.innerHeight;
  if (toggleFullscreen) return vh;
  if (orientation === "portrait") return vh * 0.45;
  if (orientation === "landscape") return vh * 0.75;
  return vh * 0.75;
};

/**
 * next/image loader に渡る w_ と揃える配信幅（CSS 幅 × DPR → deviceSizes にスナップ）。
 */
export const computeEmakiDeliveryWidth = ({
  srcWidth,
  srcHeight,
  toggleFullscreen,
  orientation,
  maxWidth = PLAYBACK_MAX_DELIVERY_WIDTH,
}) => {
  const heightPx = getEmakiDisplayHeightPx(toggleFullscreen, orientation);
  const aspect =
    srcWidth && srcHeight ? srcWidth / srcHeight : 1;
  const cssWidth = Math.round(aspect * heightPx);
  const dpr =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  let requested = Math.round(cssWidth * dpr);
  if (srcWidth) requested = Math.min(requested, srcWidth);
  if (maxWidth) requested = Math.min(requested, maxWidth);
  return snapToDeviceSize(requested);
};

export const buildEmakiCloudinaryImageUrl = (src, deliveryWidth) =>
  buildCloudinaryUrl(src, [`w_${deliveryWidth}`, "f_auto", "q_auto:eco"]);

/** LazyImage / next/image 用 loader（preload と同一変換） */
export const createEmakiCloudinaryLoader = () => ({ src, width: w }) =>
  buildCloudinaryUrl(src, [`w_${w}`, "f_auto", "q_auto:eco"]);
