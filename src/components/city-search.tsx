"use client";

import { Check, MapPin } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TURKISH_PROVINCES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
] as const;

function normalize(text: string) {
  return text.toLocaleLowerCase("tr-TR");
}

type CitySearchProps = {
  name: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string, isSelectedFromList: boolean) => void;
};

export function CitySearch({ name, placeholder, ariaLabel, className, defaultValue = "", onValueChange }: CitySearchProps) {
  const listboxId = useId();
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestions = value.trim()
    ? TURKISH_PROVINCES.filter((city) => normalize(city).startsWith(normalize(value.trim()))).slice(0, 8)
    : [];
  const suggestionsOpen = isOpen && suggestions.length > 0;

  const updateValue = (nextValue: string, selectedFromList: boolean) => {
    setValue(nextValue);
    setIsConfirmed(selectedFromList);
    onValueChange?.(nextValue, selectedFromList);
  };
  const selectSuggestion = (index: number) => {
    const city = suggestions[index];
    if (!city) return;
    updateValue(city, true);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          type="text" name={isConfirmed ? "city" : name} value={value}
          onChange={(event) => { updateValue(event.target.value, false); setIsOpen(true); setHighlightedIndex(-1); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setIsOpen(false); setHighlightedIndex(-1); return; }
            if (!suggestionsOpen) return;
            if (event.key === "ArrowDown") { event.preventDefault(); setHighlightedIndex((current) => (current + 1) % suggestions.length); return; }
            if (event.key === "ArrowUp") { event.preventDefault(); setHighlightedIndex((current) => current <= 0 ? suggestions.length - 1 : current - 1); return; }
            if (event.key === "Enter" || event.key === "Tab") { event.preventDefault(); selectSuggestion(highlightedIndex >= 0 ? highlightedIndex : 0); }
          }}
          placeholder={placeholder} aria-label={ariaLabel} role="combobox"
          aria-expanded={suggestionsOpen} aria-controls={suggestionsOpen ? listboxId : undefined}
          aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          aria-autocomplete="list" autoComplete="off"
          className="h-11 w-full border-transparent bg-white pr-10 text-foreground"
        />
        {isConfirmed && <Check aria-label="Şehir seçildi" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />}
      </div>
      {suggestionsOpen && (
        <ul id={listboxId} role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg">
          {suggestions.map((city, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li key={city} id={`${listboxId}-option-${index}`} role="option" aria-selected={isHighlighted}>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setHighlightedIndex(index)} onClick={() => selectSuggestion(index)} className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors", isHighlighted ? "bg-primary/10 text-primary" : "hover:bg-primary/10 hover:text-primary")}>
                  <MapPin className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                  {city}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
