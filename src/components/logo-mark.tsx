/**
 * Marka amblemi: pusula halkası içinde basitleştirilmiş bir Asklepios
 * asası (hekimlik sembolü). `currentColor` kullanır, böylece kullanıldığı
 * yerin metin rengini alır — header'da küçük, ana sayfa hero'sunda büyük.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M24 12 C24 16, 20 16, 20 20 C20 24, 28 24, 28 28 C28 32, 24 32, 24 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
