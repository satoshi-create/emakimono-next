const config = {
  siteUrl: "https://www.emakimono.com/",
  exclude: [`/server-sitemap.xml`],
  robotsTxtOptions: {
    additionalSitemaps: ['https://www.emakimono.com/server-sitemap.xml'],
  },
};

module.exports = config;
