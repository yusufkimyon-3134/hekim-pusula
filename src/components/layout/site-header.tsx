import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { MobileMenuLinks } from "@/components/layout/mobile-menu-links";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { getAuthUser } from "@/lib/auth";
import { logout } from "@/lib/actions/logout";
import { getPendingVerificationCount } from "@/lib/admin/data";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { safeQuery } from "@/lib/safe-query";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const authUser = await getAuthUser();
  const isAdmin = authUser?.app_metadata?.role === "admin";
  const [doctor, pendingVerificationCount] = await Promise.all([
    authUser ? safeQuery(async () => new DoctorRepository(await createClient()).findById(authUser.id), null) : null,
    isAdmin ? safeQuery(getPendingVerificationCount, 0) : 0,
  ]);

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900 md:border-border md:bg-primary md:text-primary-foreground">
      <Container className="flex h-13 min-w-0 items-center justify-between gap-3 md:h-16">
        <Link prefetch={false} href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <LogoMark className="h-6 w-6 shrink-0 text-teal-700 md:text-[color:var(--color-ring)]" />
          <span className="truncate">Hekim Pusula</span>
        </Link>

        {authUser ? (
          <div className="flex shrink-0 items-center gap-5 text-sm">
            {doctor?.isVerified && (
              <Link prefetch={false} href="/career-match" className="hidden opacity-90 transition-opacity hover:opacity-100 md:inline">
                Kariyer eşleştirme
              </Link>
            )}
            <details className="relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2 font-medium hover:bg-slate-100 md:hover:bg-primary-foreground/10 [&::-webkit-details-marker]:hidden">
                <span className="sr-only md:not-sr-only">Profilim</span>
                <Menu aria-hidden="true" className="size-5 md:hidden" />
                <ChevronDown aria-hidden="true" className="hidden size-4 md:block" />
              </summary>
              <MobileMenuLinks label="Profil menüsü">
                <Link prefetch={false} href="/profile" className="px-4 py-3 transition-colors hover:bg-accent">Profilim</Link>
                <Link prefetch={false} href="/questions" className="px-4 py-3 transition-colors hover:bg-accent">Sorularım</Link>
                {doctor?.isVerified && (
                  <Link prefetch={false} href="/career-match" className="px-4 py-3 transition-colors hover:bg-accent md:hidden">Kariyer eşleştirme</Link>
                )}
                {isAdmin && (
                  <Link prefetch={false} href="/admin" className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent">
                    Admin Paneli
                    {pendingVerificationCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        {pendingVerificationCount > 99 ? "99+" : pendingVerificationCount}
                      </span>
                    )}
                  </Link>
                )}
                <form action={logout} className="border-t border-border">
                  <button type="submit" className="min-h-11 w-full px-4 py-3 text-left transition-colors hover:bg-accent">Çıkış yap</button>
                </form>
              </MobileMenuLinks>
            </details>
          </div>
        ) : (
          <>
            <nav aria-label="Ana menü" className="hidden items-center gap-6 text-sm md:flex">
              <Link prefetch={false} href="/login" className="opacity-90 transition-opacity hover:opacity-100">Giriş yap</Link>
              <Link prefetch={false} href="/register" className="rounded-md bg-[color:var(--color-ring)] px-3 py-1.5 font-medium text-primary transition-opacity hover:opacity-90">Kayıt ol</Link>
            </nav>
            <details className="relative shrink-0 md:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                <Menu aria-hidden="true" className="size-5" />
                <span className="sr-only">Menü</span>
              </summary>
              <MobileMenuLinks>
                <Link prefetch={false} href="/" className="px-4 py-3 transition-colors hover:bg-accent">Ana sayfa</Link>
                <Link prefetch={false} href="/login" className="px-4 py-3 transition-colors hover:bg-accent">Giriş yap</Link>
                <Link prefetch={false} href="/register" className="px-4 py-3 font-medium transition-colors hover:bg-accent">Kayıt ol</Link>
              </MobileMenuLinks>
            </details>
          </>
        )}
      </Container>
    </header>
  );
}
