import type { DoctorRole } from "@/types";

export const DOCTOR_ROLE_LABELS: Record<DoctorRole, string> = {
  general_practitioner: "Pratisyen Hekim",
  specialist: "Uzman Hekim",
  subspecialist: "Yan Dal Uzmanı",
};

export const DOCTOR_ROLE_OPTIONS: { value: DoctorRole; label: string }[] = (
  Object.entries(DOCTOR_ROLE_LABELS) as [DoctorRole, string][]
).map(([value, label]) => ({ value, label }));
