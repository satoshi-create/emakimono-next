export const GA_MEASURAMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

export const pageView = (url) => {

  window.gtag("config", GA_MEASURAMENT_ID, {
    page_path: url,
  });
};
