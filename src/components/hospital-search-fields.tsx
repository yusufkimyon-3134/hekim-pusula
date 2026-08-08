"use client";

import { useEffect, useRef, useState } from "react";
import { CitySearch } from "@/components/city-search";
import { HospitalTypeSelect } from "@/components/hospital-type-select";

export function HospitalSearchFields() {
  const [citySelected, setCitySelected] = useState(false);
  const hospitalTypeRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (citySelected) hospitalTypeRef.current?.focus();
  }, [citySelected]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <CitySearch
        name="q"
        placeholder="Hastane, il, ilçe veya branş ara… (örn. “Reyhanlı”)"
        ariaLabel="Kurum veya klinik ara"
        onValueChange={(_, selectedFromList) => setCitySelected(selectedFromList)}
      />
      {citySelected && <HospitalTypeSelect selectRef={hospitalTypeRef} />}
    </div>
  );
}
