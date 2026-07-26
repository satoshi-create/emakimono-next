const withdrawnTitleen = require("./src/libs/constants/withdrawnTitleen.json");

const withdrawnExcludes = withdrawnTitleen.flatMap((slug) => [
  `/${slug}`,
  `/ja/${slug}`,
]);

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.SITE_URL || "https://emakimono.com",
  generateRobotsTxt: true,
  exclude: withdrawnExcludes,
};

module.exports = config;

// https://yukimasablog.com/nextjs-sitemap
