export const GA_MEASURAMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

export const pageView = (url) => {
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
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};
