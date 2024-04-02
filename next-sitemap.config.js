const config = {
  siteUrl: `https://${process.env.NEXT_PUBLIC_SITE_DOMAIN}`,
  // TODD : スクレイピング対策のためsitemapの名前を変更する
  // https://ph-1ab.com/exclude-specific-url-in-next-sitemap/
  // https://zenn.dev/masa5714/articles/b00f4ebffbbcd4
  // sitemapBaseFileName:"sitemap-9?4kanbb1&&",
  generateRobotsTxt: true,
  // outdir: "./out",
  // sitemapSize: 7000,
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

// https://yukimasablog.com/nextjs-sitemap
