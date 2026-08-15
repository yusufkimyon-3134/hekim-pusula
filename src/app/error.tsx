"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

/**
 * Bug fix: kök seviyede bir `error.tsx` daha önce yoktu — herhangi bir
 * sayfa segmentinde yakalanmamış bir hata (örn. Supabase yapılandırılmamış
 * veya erişilemezken) Next.js'in kendi ham hata ekranını gösteriyordu.
 * Bu, diğer sayfalardaki (`search`, `hospital/[id]`, `clinic/[id]`) aynı
 * desenle tutarlı, uygulama genelinde bir güvenlik ağı.
 */
export default function RootError({
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
    <Container className="py-16 text-center">
      <h1 className="text-xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Sayfa yüklenirken geçici bir hata oluştu. Tekrar deneyebilir veya
        giriş sayfasına dönüp oturumunu yeniden açabilirsin.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Tekrar dene
      </Button>
    </Container>
  );
}

