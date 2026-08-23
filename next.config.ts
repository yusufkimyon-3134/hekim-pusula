import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SEO/canonical URL standardı: Hekim Pusula URL'leri sonda slash olmadan kullanılır.
  // Sitemap ve canonical etiketleri de /search ve /rankings biçiminde yayınlanıyor.
  trailingSlash: false,
};

export default nextConfig;
