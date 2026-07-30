import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { register } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
