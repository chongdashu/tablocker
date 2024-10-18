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
  transform: async (config, path) => {
    // Only include canonical URLs in the sitemap
    const canonicalUrl = `${config.siteUrl}${path}`;
    const isCanonical = await isCanonicalPage(canonicalUrl);

    if (!isCanonical) {
      return null; // Exclude non-canonical URLs from the sitemap
    }

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

// Helper function to check if a URL is canonical
async function isCanonicalPage(url) {
  // Implement logic to check if the URL is canonical
  // This could involve checking the page's canonical tag or other criteria
  // Return true if the URL is canonical, false otherwise
  // For now, we'll assume all URLs are canonical except for specific cases
  return !url.includes("/register");
}
