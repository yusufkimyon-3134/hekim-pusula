import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hekimpusula.com.tr";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/rankings`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/kvkk-aydinlatma`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
