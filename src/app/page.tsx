import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hekim Pusula
        </h1>
        <p className="mt-3 text-muted-foreground">
          Doğru kurumu, gerçek deneyimlerle keşfet. Kura veya atama
          öncesi, oraya gidenin anlattığını oku.
        </p>

        <form
          action="/search"
          className="mt-8 flex items-center gap-2 text-left"
        >
          <Input
            name="q"
            placeholder="İl, ilçe veya kurum ara…"
            aria-label="Kurum ara"
          />
          <Button type="submit">Ara</Button>
        </form>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kurum deneyimlerini oku</CardTitle>
            <CardDescription>
              Nöbet yükü, yönetim, ulaşım ve daha fazlası hakkında oradan
              geçmiş hekimlerin paylaşımları.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/search">Kurumları keşfet</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bir klinik mi arıyorsun?</CardTitle>
            <CardDescription>
              Aynı kurum içindeki branşa özel deneyimlere de göz atabilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/clinic/ornek">Örnek klinik sayfası</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
