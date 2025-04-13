// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["ja", "en"],
  },
  localePath:
    typeof window === "undefined"
      ? require("path").resolve("./public/locales")
      : "/locales",
};
