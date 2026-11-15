"use client";

import type { MouseEvent, ReactNode } from "react";

export function MobileMenuLinks({ children, label = "Mobil ana menü" }: { children: ReactNode; label?: string }) {
  function closeOnLinkClick(event: MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("a[href]")) {
      const menu = event.currentTarget.closest("details");
      if (menu) menu.open = false;
    }
  }

  return (
    <nav
      aria-label={label}
      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex min-w-52 flex-col overflow-hidden rounded-lg border border-border bg-background py-1 text-sm text-foreground shadow-xl [@media(hover:none)]:[&_a:active]:bg-ring/25! [@media(hover:none)]:[&_button:active]:bg-ring/25! [@media(hover:none)]:[&_:active]:duration-0"
      onClickCapture={closeOnLinkClick}
    >
      {children}
    </nav>
  );
}
