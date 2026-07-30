import type { ReactNode } from "react";
import Link from "next/link";

export function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export function DashboardRow({
  href,
  primary,
  secondary,
  value,
}: {
  href: string;
  primary: string;
  secondary?: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{primary}</p>
        {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
      </div>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{value}</span>
    </Link>
  );
}

export function DashboardEmpty() {
  return (
    <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
      Henüz yeterli veri yok.
    </p>
  );
}
