"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function SearchError({
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
      <h1 className="text-xl font-semibold">Arama yapılamadı</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Sonuçlar yüklenirken bir hata oluştu. Bağlantını kontrol edip tekrar
        deneyebilirsin.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Tekrar dene
      </Button>
    </Container>
  );
}
