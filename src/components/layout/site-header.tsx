import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { getAuthUser } from "@/lib/auth";
import { logout } from "@/lib/actions/logout";
import { getPendingVerificationCount } from "@/lib/admin/data";

export async function SiteHeader() {
  const authUser = await getAuthUser();
  const isAdmin = authUser?.app_metadata?.role === "admin";
  let pendingVerificationCount = 0;

  if (isAdmin) {
    try {
      pendingVerificationCount = await getPendingVerificationCount();
    } catch {
      // Admin sayacı ikincildir; bir hata ana menüyü engellememeli.
    }
  }

  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <Container className="flex h-16 min-w-0 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <LogoMark className="h-6 w-6 text-[color:var(--color-ring)]" />
          <span className="truncate">Hekim Pusula</span>
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="opacity-90 transition-opacity hover:opacity-100">
            Ana sayfa
          </Link>

          {authUser ? (
            <>
              <Link href="/questions" className="opacity-90 transition-opacity hover:opacity-100">
                Sorularım
              </Link>
              <Link href="/profile" className="opacity-90 transition-opacity hover:opacity-100">
                Profilim
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100"
                >
                  Admin Paneli
                  {pendingVerificationCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                      {pendingVerificationCount > 99 ? "99+" : pendingVerificationCount}
                    </span>
                  )}
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="cursor-pointer opacity-90 transition-opacity hover:opacity-100"
                >
                  Çıkış yap
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="opacity-90 transition-opacity hover:opacity-100">
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

        <details className="group relative shrink-0 md:hidden">
          <summary className="flex min-h-11 list-none items-center gap-2 rounded-md border border-primary-foreground/25 px-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
            Menü
          </summary>
          <nav
            aria-label="Mobil ana menü"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex min-w-52 flex-col overflow-hidden rounded-lg border border-border bg-background py-1 text-sm text-foreground shadow-xl"
          >
            <Link href="/" className="px-4 py-3 transition-colors hover:bg-accent">
              Ana sayfa
            </Link>
            {authUser ? (
              <>
                <Link href="/questions" className="px-4 py-3 transition-colors hover:bg-accent">
                  Sorularım
                </Link>
                <Link href="/profile" className="px-4 py-3 transition-colors hover:bg-accent">
                  Profilim
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    Admin Paneli
                    {pendingVerificationCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        {pendingVerificationCount > 99 ? "99+" : pendingVerificationCount}
                      </span>
                    )}
                  </Link>
                )}
                <form action={logout} className="border-t border-border">
                  <button
                    type="submit"
                    className="min-h-11 w-full px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    Çıkış yap
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-3 transition-colors hover:bg-accent">
                  Giriş yap
                </Link>
                <Link href="/register" className="px-4 py-3 font-medium transition-colors hover:bg-accent">
                  Kayıt ol
                </Link>
              </>
            )}
          </nav>
        </details>
      </Container>
    </header>
  );
}
