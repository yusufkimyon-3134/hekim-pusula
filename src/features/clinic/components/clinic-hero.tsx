import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";
import type { Hospital } from "@/types";

export function ClinicHero({
  branch,
  hospital,
}: {
  branch: string;
  hospital: Hospital;
}) {
  return (
    <div className="space-y-5">
      <Link
        href={`/hospital/${hospital.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {hospital.name}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {branch}
        </h1>
        <Badge variant="secondary" className="shrink-0">
          {HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
        </Badge>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0" />
        {hospital.district}, {hospital.city}
      </p>
    </div>
  );
}
