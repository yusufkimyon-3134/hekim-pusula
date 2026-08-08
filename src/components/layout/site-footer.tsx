import Link from "next/link";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-3 py-4 text-xs text-muted-foreground sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:py-0">
        <span>© {new Date().getFullYear()} Hekim Pusula</span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="hidden sm:inline">Doğru kurumu, gerçek deneyimlerle keşfet.</span>
          <Link href="/kvkk-aydinlatma" className="underline-offset-2 hover:underline">
            KVKK Aydınlatma Metni
          </Link>
          <Link href="/kullanim-kosullari" className="underline-offset-2 hover:underline">
            Kullanım Koşulları
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
