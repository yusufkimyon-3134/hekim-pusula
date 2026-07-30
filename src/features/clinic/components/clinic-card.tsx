import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function ClinicCard({
  branch,
  href,
  subtitle,
}: {
  branch: string;
  href: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">{branch}</CardTitle>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}
