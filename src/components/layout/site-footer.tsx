import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <Container className="flex h-14 items-center justify-between text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Hekim Pusula</span>
        <span>Doğru kurumu, gerçek deneyimlerle keşfet.</span>
      </Container>
    </footer>
  );
}
