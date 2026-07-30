import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * `doctors.is_verified` true olduğunda gösterilir. Belge yükleme akışı
 * (diploma/TTB no/SGK hizmet dökümü) bu sprint kapsamında değil — bu
 * yalnızca ileride bu alan `true` olduğunda görünecek rozetin arayüzü.
 */
export function VerifiedBadge() {
  return (
    <Badge variant="soft" className="gap-1">
      <BadgeCheck className="size-3" />
      Doğrulanmış hekim
    </Badge>
  );
}
