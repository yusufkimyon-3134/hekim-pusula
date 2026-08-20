import { createClient } from "@/lib/supabase/server";

const baseUrl = "https://www.hekimpusula.com.tr";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: "1.0" },
  { path: "/search", changeFrequency: "daily", priority: "0.9" },
  { path: "/rankings", changeFrequency: "daily", priority: "0.8" },
  { path: "/compare", changeFrequency: "weekly", priority: "0.7" },
  { path: "/register", changeFrequency: "monthly", priority: "0.5" },
  { path: "/kvkk-aydinlatma", changeFrequency: "yearly", priority: "0.2" },
  { path: "/kullanim-kosullari", changeFrequency: "yearly", priority: "0.2" },
] as const;

type SitemapEntry = {
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderUrl({ path, changeFrequency, priority }: SitemapEntry) {
  return `  <url>\n    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n    <changefreq>${changeFrequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET() {
  const entries: SitemapEntry[] = [...staticRoutes];

  // Hastane ve klinik kimlikleri herkese açık referans verisidir.
  // Sitemap üretimi sırasında bir DB sorunu olursa statik sitemap yine
  // çalışmaya devam eder; Google'a 500 döndürmek yerine dinamik URL'ler
  // bir sonraki taramada tekrar eklenir.
  try {
    const supabase = await createClient();
    const [{ data: hospitals, error: hospitalsError }, { data: clinics, error: clinicsError }] =
      await Promise.all([
        supabase.from("hospitals").select("id").order("id"),
        supabase.from("clinics").select("id").order("id"),
      ]);

    if (!hospitalsError) {
      for (const hospital of hospitals ?? []) {
        entries.push({
          path: `/hospital/${hospital.id}`,
          changeFrequency: "weekly",
          priority: "0.8",
        });
      }
    }

    if (!clinicsError) {
      for (const clinic of clinics ?? []) {
        entries.push({
          path: `/clinic/${clinic.id}`,
          changeFrequency: "weekly",
          priority: "0.9",
        });
      }
    }
  } catch {
    // Statik URL'lerle geçerli bir sitemap döndürmeye devam et.
  }

  const urls = entries.map(renderUrl).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
