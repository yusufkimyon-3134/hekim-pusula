import type { MetadataRoute } from "next";

const siteUrl = "https://www.hekimpusula.com.tr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/hospital/", "/clinic/", "/search", "/rankings"],
      disallow: [
        "/api/",
        "/admin",
        "/profile",
        "/questions",
        "/login",
        "/register",
        "/auth/",
        "/reset-password",
        "/forgot-password",
        "/account-deleted",
        "/clinic/*/review",
        "/clinic/*/question",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
