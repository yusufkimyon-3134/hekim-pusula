import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HOSPITAL_TYPE_OPTIONS } from "@/lib/hospital-type";
import type { CityCount, HospitalType } from "@/types";

/**
 * Kasıtlı olarak sade bir HTML formu (client component değil): şehir/tür
 * seçimi native `<select>` ile yapılıyor, JS olmadan da GET ile çalışıyor.
 * "Gereksiz client-side render'dan kaçın" gereksinimini karşılamak için
 * burada Radix tabanlı (JS gerektiren) shadcn Select yerine bilinçli
 * olarak native select tercih edildi.
 */
export function SearchForm({
  defaultQuery,
  defaultCity,
  defaultHospitalType,
  cities,
}: {
  defaultQuery?: string;
  defaultCity?: string;
  defaultHospitalType?: HospitalType;
  cities: CityCount[];
}) {
  return (
    <form action="/search" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={defaultQuery}
          placeholder="Hastane, il, ilçe veya branş ara… (örn. “Konya Göz”)"
          aria-label="Kurum veya klinik ara"
          className="sm:flex-1"
        />
        <Button type="submit" size="lg" className="sm:w-auto">
          Ara
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="city"
          defaultValue={defaultCity ?? ""}
          aria-label="Şehir filtresi"
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">Tüm şehirler</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.hospitalCount})
            </option>
          ))}
        </select>

        <select
          name="hospitalType"
          defaultValue={defaultHospitalType ?? ""}
          aria-label="Hastane türü filtresi"
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="">Tüm hastane türleri</option>
          {HOSPITAL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <Button type="submit" variant="outline" size="sm" className="sm:w-auto">
          Filtrele
        </Button>
      </div>
    </form>
  );
}
