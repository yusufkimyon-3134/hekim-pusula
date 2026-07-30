import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-56" />
      <Skeleton className="mt-6 h-24 w-full" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </Container>
  );
}
