"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Ana sayfa" },
  { href: "/search", label: "Kurum ara" },
];

/**
 * Yalnızca sabit menü linklerini ("Ana sayfa", "Kurum ara") render eden
 * küçük, izole bir client component. Client olmasının tek sebebi:
 * geçerli sayfanın (`usePathname`) ana sayfa (`/`) olup olmadığına göre
 * "Kurum ara" linkini gizleyebilmek — bu bilgi server component'lerde
 * doğrudan mevcut değil. Auth'a bağlı linkler (Profilim/Giriş/Kayıt/
 * Çıkış) hâlâ `SiteHeader`'da (server component), burada değil.
 */
export function SiteHeaderNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems
        .filter((item) => !(item.href === "/search" && pathname === "/"))
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            {item.label}
          </Link>
        ))}
    </>
  );
}
