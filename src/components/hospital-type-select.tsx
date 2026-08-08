import { NativeSelect } from "@/components/ui/native-select";
import { HOSPITAL_TYPE_OPTIONS } from "@/lib/hospital-type";

export function HospitalTypeSelect({
  selectRef,
}: {
  selectRef: React.RefObject<HTMLSelectElement | null>;
}) {
  return (
    <NativeSelect
      ref={selectRef}
      name="hospitalType"
      defaultValue=""
      aria-label="Hastane türü seç"
      className="h-11 border-transparent bg-white text-foreground"
    >
      <option value="">Hastane türü seç (isteğe bağlı)</option>
      {HOSPITAL_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}
