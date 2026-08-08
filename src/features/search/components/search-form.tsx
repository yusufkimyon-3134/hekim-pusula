import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { HOSPITAL_TYPE_OPTIONS } from "@/lib/hospital-type";
import type { CityCount, HospitalType } from "@/types";

/**
 * Kasıtlı olarak sade bir HTML formu (client component değil): şehir/tür
 * seçimi native `<select>` ile yapılıyor, JS olmadan da GET ile çalışıyor.
 * "Gereksiz client-side render'dan kaçın" gereksinimini karşılamak için
 * burada Radix tabanlı (JS gerektiren) shadcn Select yerine bilinçli
 * olarak native select tercih edildi. Sprint 6'daki "gelişmiş filtreler"
 * de aynı sebeple native `<details>/<summary>` ile (JS'siz açılır-kapanır
 * bölüm) eklendi.
 */
export function SearchForm({
  defaultQuery,
  defaultCity,
  defaultHospitalType,
  defaultMinOverall,
  defaultMinEducation,
  defaultMinAcademic,
  defaultMaxMonthlyShifts,
  cities,
}: {
  defaultQuery?: string;
  defaultCity?: string;
  defaultHospitalType?: HospitalType;
  defaultMinOverall?: string;
  defaultMinEducation?: string;
  defaultMinAcademic?: string;
  defaultMaxMonthlyShifts?: string;
  cities: CityCount[];
}) {
  const hasAdvancedFilters = Boolean(
    defaultMinOverall || defaultMinEducation || defaultMinAcademic || defaultMaxMonthlyShifts
  );

  return (
    <form action="/search" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          defaultValue={defaultQuery}
          placeholder="Hastane veya branş adı yaz"
          aria-label="Kurum veya klinik ara"
          className="sm:flex-1"
        />
        <Button type="submit" size="lg" className="sm:w-auto">
          Ara
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <NativeSelect
          name="city"
          defaultValue={defaultCity ?? ""}
          aria-label="Şehir filtresi"
          className="flex-1"
        >
          <option value="">Tüm şehirler</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} ({c.hospitalCount})
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          name="hospitalType"
          defaultValue={defaultHospitalType ?? ""}
          aria-label="Hastane türü filtresi"
          className="flex-1"
        >
          <option value="">Tüm hastane türleri</option>
          {HOSPITAL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <details className="rounded-md border border-border" open={hasAdvancedFilters}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
          Gelişmiş filtreler (yalnızca klinikler için)
        </summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="minOverall" className="text-xs">
              Min. genel puan
            </Label>
            <Input
              id="minOverall"
              name="minOverall"
              type="number"
              min={1}
              max={5}
              step={0.5}
              defaultValue={defaultMinOverall}
              placeholder="Örn. 4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="minEducation" className="text-xs">
              Min. eğitim puanı
            </Label>
            <Input
              id="minEducation"
              name="minEducation"
              type="number"
              min={1}
              max={5}
              step={0.5}
              defaultValue={defaultMinEducation}
              placeholder="Örn. 4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="minAcademic" className="text-xs">
              Min. akademik puan
            </Label>
            <Input
              id="minAcademic"
              name="minAcademic"
              type="number"
              min={1}
              max={5}
              step={0.5}
              defaultValue={defaultMinAcademic}
              placeholder="Örn. 4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="maxMonthlyShifts" className="text-xs">
              Maks. aylık nöbet
            </Label>
            <Input
              id="maxMonthlyShifts"
              name="maxMonthlyShifts"
              type="number"
              min={0}
              max={60}
              defaultValue={defaultMaxMonthlyShifts}
              placeholder="Örn. 8"
            />
          </div>
        </div>
      </details>
    </form>
  );
}
