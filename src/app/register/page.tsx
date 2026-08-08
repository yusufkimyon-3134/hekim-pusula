import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { register } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  if (checkEmail === "1") {
    return (
      <Container className="flex justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent">
              <Mail className="size-5 text-accent-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">E-postanı kontrol et</p>
              <p className="text-sm text-muted-foreground">
                Aktivasyon bağlantısını e-posta adresine gönderdik. Hesabını
                açmak için e-postandaki bağlantıya tıkla.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href="/login">Giriş sayfasına dön</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Kayıt ol</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kayıt olduktan sonra profilini tamamlayacaksın.
          </p>
        </CardHeader>
        <CardContent>
          <form action={register} className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" required autoFocus />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
              <p className="text-xs text-muted-foreground">En az 6 karakter.</p>
            </div>

            <div className="space-y-2.5 border-t border-border pt-4">
              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="acceptKvkk"
                  required
                  className="mt-0.5 size-4 shrink-0 rounded border-input"
                />
                <span>
                  <Link
                    href="/kvkk-aydinlatma"
                    target="_blank"
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    KVKK Aydınlatma Metni
                  </Link>
                  &apos;ni okudum.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  required
                  className="mt-0.5 size-4 shrink-0 rounded border-input"
                />
                <span>
                  <Link
                    href="/kullanim-kosullari"
                    target="_blank"
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    Kullanım Koşulları
                  </Link>
                  &apos;nı kabul ediyorum.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full">
              Kayıt ol
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-foreground underline-offset-2 hover:underline">
              Giriş yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
