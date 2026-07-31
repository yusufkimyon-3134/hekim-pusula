"use client";

import { useEffect } from "react";

/**
 * Bug fix: `global-error.tsx` yoktu. Bu, yalnızca kök `layout.tsx`'in
 * KENDİSİ hata verirse devreye girer (örn. `SiteHeader` içinde
 * yakalanmamış bir hata) — `error.tsx`'ten farklı olarak kendi
 * `<html>`/`<body>`'sini render etmek zorunda, çünkü kök layout'un
 * yerini alıyor. Sade tutuldu, marka bileşenlerine bağımlı değil —
 * layout'un kendisi bozuksa o bileşenlere güvenilemez.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Bir şeyler ters gitti</h1>
        <p style={{ marginTop: "0.5rem", color: "#565a54", maxWidth: "24rem", marginInline: "auto" }}>
          Uygulama yüklenirken beklenmeyen bir hata oluştu. Bu genellikle
          Supabase ortam değişkenlerinin (.env.local) eksik olmasından
          kaynaklanır.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1.5rem",
            background: "#0f2226",
            color: "#f3f1ea",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
