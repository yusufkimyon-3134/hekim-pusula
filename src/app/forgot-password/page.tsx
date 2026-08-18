"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const RECOVERY_REDIRECT_URL = "https://hekimpusula.com.tr/reset-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: RECOVERY_REDIRECT_URL,
      });

      // Hesabın varlığını kullanıcıya hiçbir durumda açıklamıyoruz.
      if (error) {
        console.error("[forgot-password] reset e-postası gönderilemedi:", error.message);
      }
    } catch (error) {
      console.error("[forgot-password] beklenmeyen reset hatası:", error);
    } finally {
      // Account enumeration'ı önlemek için başarı/hata halinde aynı ekran.
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
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
                Bu adresle eşleşen bir hesap varsa şifre yenileme bağlantısını gönderdik. Gelen kutunda görünmüyorsa spam klasörünü de kontrol et.
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
          <CardTitle className="text-xl">Şifreni mi unuttun?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hesabında kullandığın e-posta adresini gir. Sana güvenli bir şifre yenileme bağlantısı gönderelim.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Gönderiliyor…" : "Şifre yenileme bağlantısı gönder"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline-offset-2 hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
