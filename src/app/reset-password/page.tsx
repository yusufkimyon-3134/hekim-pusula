"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    const timeout = window.setTimeout(() => {
      if (mounted) setReady((current) => current);
    }, 1500);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Girdiğin şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      console.error("[reset-password] şifre güncellenemedi:", updateError.message);
      setError("Bağlantının süresi dolmuş olabilir. Lütfen yeni bir şifre yenileme bağlantısı iste.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <Container className="flex justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent">
              <CheckCircle2 className="size-5 text-accent-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Şifren başarıyla yenilendi</p>
              <p className="text-sm text-muted-foreground">Yeni şifrenle Hekim Pusula hesabına giriş yapabilirsin.</p>
            </div>
            <Button asChild className="mt-2 w-full"><Link href="/login?passwordReset=1">Giriş yap</Link></Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Yeni şifre oluştur</CardTitle>
          <p className="text-sm text-muted-foreground">Hesabın için yeni ve güçlü bir şifre belirle.</p>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Güvenli şifre yenileme bağlantısı doğrulanıyor…</p>
              <p className="text-xs text-muted-foreground">Bu ekran uzun süre değişmezse bağlantının süresi dolmuş olabilir.</p>
              <Button asChild variant="outline" className="w-full"><Link href="/forgot-password">Yeni bağlantı iste</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="password">Yeni şifre</Label>
                <Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
                <p className="text-xs text-muted-foreground">En az 8 karakter.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Yeni şifreyi tekrar gir</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Güncelleniyor…" : "Şifremi yenile"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
