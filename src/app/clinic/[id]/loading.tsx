import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mt-8 h-4 w-40" />
      <Skeleton className="mt-3 h-24 w-full" />
    </Container>
  );
}
