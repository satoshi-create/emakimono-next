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
    // Vercel rewrite プロキシ。SW が 404 を CacheFirst で固着させない
    {
      urlPattern: /\/emaki-assets\/.*/i,
      handler: "NetworkOnly",
    },
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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    // デスクトップ横画面（75vh × DPR2）の上限は 2560。3840 は教室一斉時の過大配信になるため除外
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
  },
  async headers() {
    // dev では 86400s キャッシュを付けない（HMR が古い chunk を掴んで崩れる）
    if (process.env.NODE_ENV !== "production") return [];
    // External Rewrite キャッシュ用。catch-all より手前 + ロケール両対応
    const emakiAssetCacheHeaders = [
      {
        key: "Cache-Control",
        value:
          "public, max-age=2592000, s-maxage=31536000, stale-while-revalidate=86400",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, max-age=31536000, stale-while-revalidate=86400",
      },
      {
        key: "Vercel-CDN-Cache-Control",
        value: "public, max-age=31536000, stale-while-revalidate=86400",
      },
      {
        key: "x-vercel-enable-rewrite-caching",
        value: "1",
      },
    ];
    return [
      {
        source: "/emaki-assets/:path*",
        locale: false,
        headers: emakiAssetCacheHeaders,
      },
      {
        source: "/:locale(en|ja)/emaki-assets/:path*",
        locale: false,
        headers: emakiAssetCacheHeaders,
      },
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
        // emaki-assets を除外し、プロキシ 404 を短命キャッシュで汚染しない
        source: "/((?!_next/data/|emaki-assets/|(?:en|ja)/emaki-assets/).*)",
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
    // i18n: locale:false 時はロケールなし/ありを両方明示する
    // beforeFiles が拾えない場合に備え fallback にも同ルールを置く
    const emakiAssetRewrites = [
      {
        source: "/emaki-assets/:path*",
        destination:
          "https://res.cloudinary.com/dw2gjxrrf/image/upload/:path*",
        locale: false,
      },
      {
        source: "/:locale(en|ja)/emaki-assets/:path*",
        destination:
          "https://res.cloudinary.com/dw2gjxrrf/image/upload/:path*",
        locale: false,
      },
    ];
    return {
      beforeFiles: [...emakiAssetRewrites, ...buildStaleNextDataRewrites()],
      fallback: emakiAssetRewrites,
    };
  },
};

module.exports = withPWA(nextConfig);
