import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { register, resendActivation } from "./actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; checkEmail?: string; resent?: string; email?: string }> }) {
  const { error, checkEmail, resent, email } = await searchParams;

  if (checkEmail === "1") {
    return (
      <Container className="flex justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent"><Mail className="size-5 text-accent-foreground" /></div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Son bir adım</p>
              <p className="text-sm text-muted-foreground">{email ? <><strong className="text-foreground">{email}</strong> adresine gönderdiğimiz bağlantıya tıkla.</> : "E-postana gönderdiğimiz aktivasyon bağlantısına tıkla."}</p>
              <p className="text-xs text-muted-foreground">Mail görünmüyorsa spam/gereksiz klasörünü de kontrol et.</p>
            </div>
            {resent === "1" && <p className="w-full rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">Aktivasyon e-postası yeniden gönderildi.</p>}
            {error && <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {email && <form action={resendActivation} className="w-full"><input type="hidden" name="email" value={email} /><Button type="submit" variant="secondary" className="w-full">E-postayı yeniden gönder</Button></form>}
            <Button asChild variant="outline" className="w-full"><Link href="/login">Giriş yap</Link></Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="flex justify-center py-12 sm:py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Hekim Pusula'ya katıl</CardTitle>
          <p className="text-sm text-muted-foreground">Hesabını birkaç saniyede oluştur.</p>
        </CardHeader>
        <CardContent>
          <form action={register} className="space-y-4">
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="space-y-1.5"><Label htmlFor="email">E-posta</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="ornek@eposta.com" required autoFocus /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Şifre</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} placeholder="En az 6 karakter" required /></div>
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground"><input type="checkbox" name="acceptLegal" required className="mt-0.5 size-4 shrink-0 rounded border-input" /><span><Link href="/kvkk-aydinlatma" target="_blank" className="text-foreground underline">KVKK Aydınlatma Metni</Link>'ni okudum ve <Link href="/kullanim-kosullari" target="_blank" className="text-foreground underline">Kullanım Koşulları</Link>'nı kabul ediyorum.</span></label>
            <Button type="submit" className="w-full">Hesap oluştur</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">Zaten hesabın var mı? <Link href="/login" className="font-medium text-foreground underline-offset-2 hover:underline">Giriş yap</Link></p>
        </CardContent>
      </Card>
    </Container>
  );
}
