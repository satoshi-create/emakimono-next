/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public", // PWAのリソースを出力する場所
  // register: true, // サービスワーカーの登録を有効にする
  register: false, // Service Workerの登録を無効にする
  skipWaiting: true, // 新しいサービスワーカーがインストールされたときにページを即座にリロード
  scope: "/",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // 画像リソースのキャッシュ設定
      urlPattern: /^https:\/\/.*\/.*\.(?:png|jpg|jpeg|webp|svg|gif)$/,
      handler: "StaleWhileRevalidate", // キャッシュを使いながら、バックグラウンドで更新
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 50, // キャッシュする画像数の最大値
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1週間でキャッシュを期限切れに
        },
      },
    },
    {
      // HTMLやその他静的コンテンツの設定
      urlPattern: ({ request }) => request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "html-cache",
        expiration: {
          maxEntries: 10,
        },
      },
    },
    {
      // APIリクエストのキャッシュ設定（例）
      urlPattern: /\/api\/.*\?/, // 任意のAPIパス
      handler: "NetworkFirst", // ネットワーク優先
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1時間
        },
      },
    },
    // フォントキャッシュ
    {
      urlPattern: /^https:\/\/.*\/.*\.(?:woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日間
        },
      },
    },
    // 他のリソースはキャッシュしない（デフォルト）
    {
      urlPattern: /.*/,
      handler: "NetworkOnly", // ネットワーク優先でキャッシュなし
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "ja",
    localeDetection: false,
  },
};

module.exports = withPWA(nextConfig);
