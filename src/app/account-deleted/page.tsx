import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountDeletedPage() {
  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-md border-emerald-200">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-xl text-emerald-900">
            Hesabınız başarıyla silindi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-sm text-muted-foreground">
            Hesabınız ve hesabınıza bağlı kişisel veriler kalıcı olarak
            silindi. Artık bu hesapla giriş yapılamaz.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/">Ana sayfaya dön</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Yeni hesap oluştur</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
