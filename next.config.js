/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',  // PWAのリソースを出力する場所
  register: true,  // サービスワーカーの登録を有効にする
  skipWaiting: true,  // 新しいサービスワーカーがインストールされたときにページを即座にリロード
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  reactStrictMode: true,
    swcMinify: true,
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "ja",
    localeDetection: false,
  },
}

module.exports = withPWA(nextConfig)
