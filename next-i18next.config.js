// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["ja", "en", "zh-Hans", "zh-Hant"],
  },
  fallbackLng: {
    "zh-Hans": ["en"],
    "zh-Hant": ["en"],
    default: ["en"],
  },
  localePath:
    typeof window === "undefined"
      ? require("path").resolve("./public/locales")
      : "/locales",
};
