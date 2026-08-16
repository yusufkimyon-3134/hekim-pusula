import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";
import type { Hospital } from "@/types";

interface HospitalCardProps {
  hospital: Hospital;
  reviewCount?: number;
  avgScore?: number | null;
  isVerified?: boolean;
}

export function HospitalCard({
  hospital,
  reviewCount,
  avgScore,
  isVerified,
}: HospitalCardProps) {
  return (
    <Link href={`/hospital/${hospital.id}`} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex-1">
            <CardTitle className="text-base">{hospital.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {hospital.district}, {hospital.city}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
          </Badge>
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
