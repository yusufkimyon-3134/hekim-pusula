import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClinicCardProps {
  branch: string;
  href: string;
  subtitle?: string;
  reviewCount?: number;
  avgScore?: number | null;
  isVerified?: boolean;
}

export function ClinicCard({
  branch,
  href,
  subtitle,
  reviewCount,
  avgScore,
  isVerified,
}: ClinicCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">{branch}</CardTitle>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        {isVerified && (reviewCount !== undefined || avgScore !== null) && (
          <CardContent className="pt-0">
            <div className="flex gap-4 text-xs text-muted-foreground">
              {reviewCount !== undefined && (
                <span>{reviewCount} değerlendirme</span>
              )}
              {avgScore !== null && avgScore !== undefined && (
                <span>Ort. puan: {avgScore.toFixed(1)}</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
