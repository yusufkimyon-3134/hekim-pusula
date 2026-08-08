import { Container } from "@/components/layout/container";
import { LEGAL_DOCUMENT_VERSION } from "@/lib/repositories/legal-acceptance-repository";

export const metadata = {
  title: "Kullanım Koşulları — Hekim Pusula",
};

export default function KullanimKosullariPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kullanım Koşulları
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sürüm: {LEGAL_DOCUMENT_VERSION}
          </p>
        </div>

        <div className="rounded-md border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Kapalı beta taslağı</p>
          <p className="mt-1">
            Bu metin, Hekim Pusula&apos;nın kapalı beta sürecinde kullanılmak
            üzere hazırlanmış bir taslaktır. Platformun herkese açık
            lansmanından önce alanında uzman bir hukukçu tarafından
            incelenmesi ve gerekirse güncellenmesi gerekir.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Platformun Niteliği</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hekim Pusula, şu an{" "}
            <strong className="text-foreground">kapalı beta</strong>{" "}
            aşamasında olan bir platformdur. Özellikler, içerikler ve bu
            koşullar önceden haber verilmeksizin değişebilir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Paylaşım Kuralları</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Yorumlar yalnızca kendi kişisel deneyiminizle sınırlı olmalıdır.</li>
            <li>
              Hasta adı, T.C. kimlik numarası, sağlık bilgisi, fotoğraf, belge
              veya benzeri kimliklendirici/gizli bilgi paylaşmak{" "}
              <strong className="text-foreground">yasaktır</strong>.
            </li>
            <li>
              Bir hekimi, yöneticiyi veya çalışanı isimle hedef göstermek
              yasaktır.
            </li>
            <li>
              Küfür, hakaret, tehdit, ayrımcılık ve doğrulanamayan suçlama
              yasaktır.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Moderasyon</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Uygunsuz içerik raporlanabilir, gizlenebilir veya kaldırılabilir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Sorumluluk</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Her kullanıcı, kendi paylaştığı içerikten sorumludur.</li>
            <li>
              Platform, yorumların mutlak doğruluğunu garanti etmez —
              yorumlar bireysel deneyimlerdir.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Rumuz Görünürlüğü</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Rumuzunuzun bir yorumda görünüp görünmeyeceği tamamen sizin
            tercihinize bağlıdır; her yorum varsayılan olarak anonimdir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Hekim Doğrulaması</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hekim doğrulaması, yüklediğiniz belgenin manuel olarak
            incelenmesine dayanır. Bu süreç, e-Devlet ile{" "}
            <strong className="text-foreground">doğrudan bir entegrasyon
            değildir</strong>.
          </p>
        </section>
      </div>
    </Container>
  );
}
