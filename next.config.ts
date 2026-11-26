import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SEO/canonical URL standardı: Hekim Pusula URL'leri sonda slash olmadan kullanılır.
  // Sitemap ve canonical etiketleri de /search ve /rankings biçiminde yayınlanıyor.
  trailingSlash: false,
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "hekim-pusula-theta.vercel.app" }],
      destination: "https://www.hekimpusula.com.tr/:path*",
      permanent: true,
    }];
  },
};

export default nextConfig;
