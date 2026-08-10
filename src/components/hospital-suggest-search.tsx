"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type SuggestionWithHref = SearchSuggestion & { href: string };

function formatReviewCount(count: number): string {
  return count > 0 ? `${count} değerlendirme` : "Henüz değerlendirme yok";
}

/**
 * `reviewCount` null ise (giriş yapmamış/doğrulanmamış kullanıcı —
 * bkz. `search_suggestions` SQL fonksiyonu) alt satıra HİÇ değerlendirme
 * bilgisi eklenmiyor. "0" ile "null" bilinçli olarak farklı ele alınıyor:
 * "0" gerçekten "henüz yorum yok" demek, "null" ise "bu bilgi senin
 * için gösterilmiyor" demek — ikisini aynı metinle göstermek yanıltıcı
 * olurdu.
 */
function formatSubtitle(subtitle: string, reviewCount: number | null): string {
  return reviewCount === null ? subtitle : `${subtitle} · ${formatReviewCount(reviewCount)}`;
}

/**
 * Ana sayfadaki hero arama kutusu — yazarken (debounce'lu, min 2
 * karakter) gerçek hastane/klinik önerilerini gösterir. Bir öneriye
 * tıklanırsa/Enter'a basılırsa doğrudan o hastane/klinik sayfasına
 * gidilir. Öneri seçilmeden Enter'a basılırsa ya da dropdown hiç
 * açılmadıysa, `<input name="q">` çevreleyen `<form action="/search">`
 * ile native submit'e devam eder — serbest metin araması (mevcut
 * `/search?q=` akışı) hiç bozulmuyor.
 *
 * Not: Bu, `city-search.tsx`/`hospital-search-fields.tsx`'in YERİNE
 * hero'da kullanılıyor — ama o dosyalar SİLİNMEDİ, bozulmadı; yalnızca
 * şu an ana sayfada import edilmiyorlar. Bu bilinçli bir tercih: il
 * önerisi ile hastane/klinik önerisi farklı tıklama davranışlarına
 * (biri input'u doldurur, diğeri sayfa değiştirir) sahip olduğu için
 * aynı dropdown'da güvenle birleştirilemezler.
 */
export function HospitalSuggestSearch({
  name,
  placeholder,
  ariaLabel,
  className,
}: {
  name: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionWithHref[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { suggestions: SuggestionWithHref[] }) => {
          setSuggestions(data.suggestions ?? []);
          setHighlightedIndex(-1);
        })
        .catch((err) => {
          // Aborted istekler beklenen bir durum (kullanıcı yazmaya devam
          // etti) — yalnızca gerçek hataları logla.
          if (err.name !== "AbortError") {
            console.error("[HospitalSuggestSearch] Öneriler alınamadı:", err);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Dışarı tıklanınca listeyi kapat.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(index: number) {
    const selected = suggestions[index];
    if (!selected) return;
    setIsOpen(false);
    router.push(selected.href);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        type="text"
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setHighlightedIndex(-1);
            return;
          }

          // Dropdown açık değilse (ya da sonuç yoksa) klavyeye hiç
          // müdahale etme — Enter'ın formu normal şekilde submit etmesi
          // (mevcut /search akışı) bozulmasın.
          if (!isOpen || suggestions.length === 0) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            selectSuggestion(highlightedIndex >= 0 ? highlightedIndex : 0);
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-autocomplete="list"
        autoComplete="off"
        className="h-11 w-full border-transparent bg-white text-foreground"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
        >
          {suggestions.map((s, index) => (
            <li key={`${s.type}-${s.id}`} role="option" aria-selected={index === highlightedIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectSuggestion(index)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                  index === highlightedIndex && "bg-accent text-accent-foreground"
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {s.type === "hospital" ? "🏥" : "🩺"} {s.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatSubtitle(s.subtitle, s.reviewCount)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
