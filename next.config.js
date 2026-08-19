const defaultPwaCache = require("next-pwa/cache");

/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public", // PWAのリソースを出力する場所
  // register: true, // サービスワーカーの登録を有効にする
  register: true,
  skipWaiting: true, // 新しいサービスワーカーがインストールされたときにページを即座にリロード
  scope: "/",
  disable: process.env.NODE_ENV === "development",
  // 先頭一致が勝つ。旧 buildId の data JSON / HTML を SW に残さない
  runtimeCaching: [
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "NetworkOnly",
    },
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
    },
    ...defaultPwaCache,
  ],
});
const { i18n } = require("./next-i18next.config");
const {
  buildKusouzuSlugRedirects,
} = require("./src/libs/constants/kusouzuSlugRedirects");
const {
  buildWithdrawnScrollRedirects,
} = require("./src/libs/constants/withdrawnRedirects");
const { buildSeoRedirects } = require("./src/libs/constants/seoRedirects");

const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA || "";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Next 12 は middleware から data の buildId を消すため rewrite で受ける */
function buildStaleNextDataRewrites() {
  if (!vercelSha) return [];
  const escaped = escapeRegex(vercelSha);
  return [
    {
      source: `/_next/data/:buildId((?!${escaped})[^/]+)/:path*`,
      destination: "/api/stale-next-data",
      locale: false,
    },
  ];
}

const nextConfig = {
  reactStrictMode: true,
  ...(vercelSha
    ? {
        generateBuildId: async () => vercelSha,
        env: { NEXT_PUBLIC_BUILD_ID: vercelSha },
      }
    : {}),
  i18n,
  // CJK Google Fonts CSS を各 HTML にインラインすると ISR が約 800KB になる
  optimizeFonts: false,
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
        source: "/_next/data/:path*",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/((?!_next/data/).*)",
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
  async redirects() {
    return [
      ...buildKusouzuSlugRedirects(),
      ...buildWithdrawnScrollRedirects(),
      ...buildSeoRedirects(),
    ];
  },
  async rewrites() {
    return {
      beforeFiles: buildStaleNextDataRewrites(),
    };
  },
};

module.exports = withPWA(nextConfig);
