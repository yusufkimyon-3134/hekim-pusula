import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
    passwordReset?: string;
    accountDeleted?: string;
  }>;
}) {
  const { error, redirectTo, passwordReset, accountDeleted } = await searchParams;

  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Giriş yap</CardTitle>
          <p className="text-sm text-muted-foreground">
            Deneyim paylaşmak için hesabına giriş yap.
          </p>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

            {passwordReset === "1" && (
              <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                Şifren başarıyla yenilendi. Yeni şifrenle giriş yapabilirsin.
              </p>
            )}

            {accountDeleted === "1" && (
              <p
                role="status"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              >
                Hesabın ve bağlı verilerin kalıcı olarak silindi.
              </p>
            )}

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
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Giriş yap
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Hesabın yok mu?{" "}
            <Link href="/register" className="text-foreground underline-offset-2 hover:underline">
              Kayıt ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
