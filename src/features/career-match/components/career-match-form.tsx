import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { ScoreField } from "@/features/review/components/score-field";
import { HOSPITAL_TYPE_OPTIONS } from "@/lib/hospital-type";
import type { CityCount } from "@/types";

export function CareerMatchForm({
  branches,
  cities,
}: {
  branches: string[];
  cities: CityCount[];
}) {
  return (
    <form action="/career-match" className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="specialty">Branşın</Label>
        <NativeSelect id="specialty" name="specialty" required>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="careerGoal">Kariyer hedefin</Label>
        <NativeSelect id="careerGoal" name="careerGoal" required defaultValue="balanced">
          <option value="academic">Akademik kariyer (yayın, araştırma)</option>
          <option value="balanced">Dengeli (iş-yaşam dengesi öncelikli)</option>
          <option value="financial">Finansal (döner sermaye/ek ödeme öncelikli)</option>
        </NativeSelect>
      </div>

      <ScoreField name="academicInterest" label="Akademik fırsatlara önem verme düzeyin" />
      <ScoreField name="workloadTolerance" label="Yoğun iş yüküne toleransın" />
      <ScoreField name="nightShiftTolerance" label="Sık nöbete toleransın" />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">Şehir tercihin (opsiyonel)</Label>
          <NativeSelect id="city" name="city" defaultValue="">
            <option value="">Fark etmez</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hospitalType">Hastane türü (opsiyonel)</Label>
          <NativeSelect id="hospitalType" name="hospitalType" defaultValue="">
            <option value="">Fark etmez</option>
            {HOSPITAL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Uygun klinikleri bul
      </Button>
    </form>
  );
}
