import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/questions/", "/reset-password", "/forgot-password"],
    },
    sitemap: "https://hekimpusula.com.tr/sitemap.xml",
    host: "https://hekimpusula.com.tr",
  };
}
