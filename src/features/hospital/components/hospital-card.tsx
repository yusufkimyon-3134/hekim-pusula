import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";
import type { Hospital } from "@/types";

export function HospitalCard({ hospital }: { hospital: Hospital }) {
  return (
    <Link href={`/hospital/${hospital.id}`} className="block">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">{hospital.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {hospital.district}, {hospital.city}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
          </Badge>
        </CardHeader>
      </Card>
    </Link>
  );
}
