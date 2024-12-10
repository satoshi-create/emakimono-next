// next.config.js
const withPWA = require("next-pwa");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "ja",
    localeDetection: false,
  },
  // next-pwa設定
  pwa: {
    dest: "public", // サービスワーカーの出力先
    register: true, // サービスワーカーを登録
    skipWaiting: true, // 新しいサービスワーカーを即座にアクティブにする
  },
};

module.exports = withPWA(nextConfig);
