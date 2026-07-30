import { BadgeCheck, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * `review_count`'a göre basit bir katkı seviyesi. Bilinçli olarak yalnızca
 * bir SAYI/seviye gösterir — bir nickname veya başka sabit bir kimlikle
 * BİRLİKTE gösterilmez, böylece bu rozet farklı review'lar arasında aynı
 * hekimi eşleştirmek için kullanılamaz (anonimlik ilkesi).
 */
function reputationTier(reviewCount: number): string {
  if (reviewCount >= 10) return "Güvenilir katkıcı";
  if (reviewCount >= 3) return "Aktif katkıcı";
  return "Yeni katkıcı";
}

export function ReputationBadge({
  reviewCount,
  helpfulVotes,
  isVerified,
  showDetails = false,
}: {
  reviewCount: number;
  helpfulVotes: number;
  isVerified?: boolean;
  /** true ise sayısal detayları da gösterir (profil sayfası); false ise yalnızca seviye rozeti (review kartı). */
  showDetails?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="soft" className="gap-1">
        <Award className="size-3" />
        {reputationTier(reviewCount)}
      </Badge>
      {isVerified && (
        <Badge variant="soft" className="gap-1">
          <BadgeCheck className="size-3" />
          Doğrulanmış hekim
        </Badge>
      )}
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {reviewCount} değerlendirme · {helpfulVotes} faydalı oy aldı
        </span>
      )}
    </div>
  );
}
