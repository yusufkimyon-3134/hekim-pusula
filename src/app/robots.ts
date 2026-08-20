import type { MetadataRoute } from "next";

const siteUrl = "https://www.hekimpusula.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/profile",
        "/questions/",
        "/reset-password",
        "/forgot-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
