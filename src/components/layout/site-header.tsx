import Link from "next/link";
import { Container } from "@/components/layout/container";

const navItems = [
  { href: "/", label: "Ana sayfa" },
  { href: "/search", label: "Kurum ara" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span
            className="inline-block h-6 w-6 rounded-full border-2"
            style={{ borderColor: "var(--color-ring)" }}
            aria-hidden="true"
          />
          <span>Hekim Pusula</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="opacity-90 transition-opacity hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
