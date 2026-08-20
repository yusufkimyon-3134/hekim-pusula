const baseUrl = "https://www.hekimpusula.com.tr";

const routes = [
  { path: "", changeFrequency: "daily", priority: "1.0" },
  { path: "/search", changeFrequency: "daily", priority: "0.9" },
  { path: "/rankings", changeFrequency: "daily", priority: "0.8" },
  { path: "/compare", changeFrequency: "weekly", priority: "0.7" },
  { path: "/register", changeFrequency: "monthly", priority: "0.5" },
  { path: "/kvkk-aydinlatma", changeFrequency: "yearly", priority: "0.2" },
  { path: "/kullanim-kosullari", changeFrequency: "yearly", priority: "0.2" },
] as const;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const lastModified = new Date().toISOString();
  const urls = routes
    .map(
      ({ path, changeFrequency, priority }) => `  <url>\n    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n    <lastmod>${lastModified}</lastmod>\n    <changefreq>${changeFrequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
