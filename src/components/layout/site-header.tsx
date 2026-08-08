import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { SiteHeaderNav } from "@/components/layout/site-header-nav";
import { getAuthUserId } from "@/lib/auth";
import { logout } from "@/lib/actions/logout";

export async function SiteHeader() {
  // Not: profil tamamlanmamış olsa bile (doctors satırı henüz yoksa)
  // kullanıcı auth açısından "giriş yapmış" sayılır — bu yüzden burada
  // doctors profilini değil, doğrudan auth oturumunu kontrol ediyoruz.
  const authUserId = await getAuthUserId();

  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <LogoMark className="h-6 w-6 text-[color:var(--color-ring)]" />
          <span>Hekim Pusula</span>
        </Link>
        <nav aria-label="Ana menü" className="flex items-center gap-6 text-sm">
          <SiteHeaderNav />

          {authUserId ? (
            <>
              <Link
                href="/profile"
                className="opacity-90 transition-opacity hover:opacity-100"
              >
                Profilim
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="opacity-90 transition-opacity hover:opacity-100"
                >
                  Çıkış yap
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="opacity-90 transition-opacity hover:opacity-100"
              >
                Giriş yap
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[color:var(--color-ring)] px-3 py-1.5 font-medium text-primary transition-opacity hover:opacity-90"
              >
                Kayıt ol
              </Link>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
