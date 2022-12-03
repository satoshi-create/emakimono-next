const config = {
  siteUrl: `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}`,
  generateRobotsTxt: true,
  outDir: "./out",
  // transform: async (config, path) => {
  //   return {
  //     loc: path,
  //     changefreq: "weekly",
  //     priority: 1,
  //     lastmod: new Data().toString(),
  //   };
  // },
};

module.exports = config;
