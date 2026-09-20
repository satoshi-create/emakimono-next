export const GA_MEASURAMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

// 計測を許可する本番ホスト（localhost / 127.0.0.1 / *.vercel.app 等を除外）
const PRODUCTION_HOST_RE = /(^|\.)emakimono\.com$/;

export const isGtagEnabled = () => {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "production") return false;
  return PRODUCTION_HOST_RE.test(window.location.hostname);
};

export const pageView = (url) => {
  if (!isGtagEnabled() || typeof window.gtag !== "function") return;
  window.gtag("config", GA_MEASURAMENT_ID, {
    page_path: url,
  });
};

/**
 * GA4カスタムイベント送信
 * @param {string} action - イベントアクション名
 * @param {object} params - イベントパラメータ
 */
export const event = (action, params = {}) => {
  if (isGtagEnabled() && typeof window.gtag === "function") {
    window.gtag("event", action, params);
  }
};
