import { safeRedirectPath } from "@/lib/safe-redirect";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = safeRedirectPath(next, "/profile");
  const needsVerification = /^\/(clinic|hospital)\//.test(destination);
  const continueHref = needsVerification ? `/profile?redirectTo=${encodeURIComponent(destination)}` : destination;

  return (
    <Container className="flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent">
            <CheckCircle2 className="size-7 text-accent-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-semibold">E-posta doğrulandı</p>
            <p className="text-sm text-muted-foreground">
              Hesabın aktif. Hekim doğrulamasına başvurmak için profilini tamamlayabilirsin.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link prefetch={false} href={continueHref}>Profilimi tamamla</Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
