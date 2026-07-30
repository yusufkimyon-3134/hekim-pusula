import { Label } from "@/components/ui/label";

/**
 * 1-5 arası puan seçimi için erişilebilir, JS gerektirmeyen radio grubu
 * (native `<input type="radio">` + görsel olarak stilize edilmiş `<span>`).
 * 4 skor alanında tekrar kullanılıyor.
 */
export function ScoreField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex-1">
            <input
              type="radio"
              name={name}
              value={n}
              defaultChecked={defaultValue === n}
              required
              className="peer sr-only"
            />
            <span className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-input text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50">
              {n}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
