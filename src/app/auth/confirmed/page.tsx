"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace(next), 2200);
    return () => window.clearTimeout(timer);
  }, [next, router]);

  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent">
            <CheckCircle2 className="size-7 text-accent-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-semibold">E-posta doğrulandı</p>
            <p className="text-sm text-muted-foreground">
              Hesabın başarıyla aktifleştirildi. Profilini tamamlaman için yönlendiriliyorsun.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={next}>Devam et</Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
