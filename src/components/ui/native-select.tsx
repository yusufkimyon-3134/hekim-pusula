import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bilinçli olarak native `<select>` — Radix tabanlı shadcn `Select`
 * yerine (JS gerektirmeyen, GET/POST formlarında sunucu tarafı render'la
 * çalışan bir form deneyimi için). Arama filtreleri ve profil/review
 * formlarında tekrarlanan stil burada toplandı.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(function NativeSelect({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      data-slot="native-select"
      className={cn(
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
        className
      )}
      {...props}
    />
  );
});

export { NativeSelect };
