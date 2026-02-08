/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public", // PWAのリソースを出力する場所
  // register: true, // サービスワーカーの登録を有効にする
  register: false, // サービスワーカーの登録を有効にする
  skipWaiting: true, // 新しいサービスワーカーがインストールされたときにページを即座にリロード
  scope: "/",
  disable: process.env.NODE_ENV === "development",
});
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  reactStrictMode: true,
  i18n,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  // i18n: {
  //   locales: ["en", "ja"],
  //   defaultLocale: "en",
  //   // localeDetection: true,
  // },
  images: {
    domains: ["res.cloudinary.com"], // Cloudinaryのドメイン
    path: "/_next/image", // デフォルトパス
  },
  async headers() {
    return [
      {
        // 全てのページにキャッシュ制御ヘッダーを追加
        source: "/(.*)", // 全てのURLパス
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
