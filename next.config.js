/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ["en", "ja"],
    defaultLocale: "ja",
    // localeDetection: false,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: "https://note.com/api/v2/creators/:path*",
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
