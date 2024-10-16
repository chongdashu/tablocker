/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://untab.xyz",
  generateRobotsTxt: true,
  outDir: "./public",
  exclude: ["/register"], // Exclude pages you don't want indexed
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/register"], // Prevent crawling of /register
      },
    ],
    additionalSitemaps: ["https://untab.xyz/sitemap.xml"],
  },
  generateIndexSitemap: false, // Generate a single sitemap file
  // Optionally, customize priority and change frequency
  transform: async (config, path) => {
    // Custom transformation for specific pages
    if (path === "/") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    // Default transformation for other pages
    return {
      loc: path,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
