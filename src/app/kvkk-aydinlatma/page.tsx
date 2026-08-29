import { Container } from "@/components/layout/container";
import { LEGAL_DOCUMENT_VERSION } from "@/lib/repositories/legal-acceptance-repository";

export const metadata = {
  title: "KVKK Aydınlatma Metni — Hekim Pusula",
};

export default function KvkkAydinlatmaPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            KVKK Aydınlatma Metni
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
          <h2 className="text-base font-semibold">1. Veri Sorumlusu</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
            uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla{" "}
            <strong className="text-foreground">Yusuf Kimyon</strong>{" "}
            tarafından aşağıda açıklanan kapsamda işlenmektedir.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            İletişim:{" "}
            <a
              href="mailto:yusufkimyon@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              yusufkimyon@gmail.com
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Toplanan Veriler</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>E-posta adresi</li>
            <li>Rumuz (kullanıcı adı)</li>
            <li>Branş / unvan (statü) bilginiz</li>
            <li>İsteğe bağlı olarak paylaştığınız kurum/çalışma yeri bilgisi</li>
            <li>Platformda paylaştığınız yorumlar ve değerlendirmeler</li>
            <li>
              Hekim doğrulaması kapsamında yüklediğiniz diploma/uzmanlık
              belgesi
            </li>
            <li>
              Teknik güvenlik kayıtları (örn. oturum açma zamanı, temel
              istek/log bilgileri)
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. İşleme Amaçları</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Üyeliğinizin oluşturulması ve yönetilmesi</li>
            <li>Platform ve hesap güvenliğinin sağlanması</li>
            <li>Sahte hesap/içerik oluşturulmasının önlenmesi</li>
            <li>Hekim doğrulamasının yapılması</li>
            <li>Yorum platformunun işletilmesi ve içeriklerin yayınlanması</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Alıcılar ve Altyapı</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Verileriniz, kimlik doğrulama, veritabanı ve dosya depolama
            altyapısı için{" "}
            <strong className="text-foreground">
              Supabase (Auth, Database ve Storage)
            </strong>{" "}
            hizmetleri üzerinde barındırılmaktadır. Bunun dışında verileriniz
            üçüncü taraflarla paylaşılmaz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">5. Doğrulama Belgesine Erişim</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hekim doğrulaması için yüklediğiniz belge, herkese açık değildir;
            yalnızca yetkili yönetici incelemesi kapsamında görüntülenebilir.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">6. Haklarınız</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            KVKK&apos;nın 11. maddesi kapsamında; verilerinize erişim,
            düzeltilmesini isteme ve silinmesini talep etme haklarına
            sahipsiniz. Bu haklarınızı kullanmak için{" "}
            <a
              href="mailto:yusufkimyon@gmail.com"
              className="text-foreground underline-offset-2 hover:underline"
            >
              yusufkimyon@gmail.com
            </a>{" "}
            adresine başvurabilirsiniz.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">7. Doğrulama Belgesinin Silinmesi</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hekim doğrulama belgeniz, doğrulama işlemi (onay veya red)
            sonuçlandığı anda otomatik silme işlemi başlatılır. Diploma veya
            uzmanlık belgesi görüntüsü kalıcı olarak saklanmaz. Doğrulama
            işleminin sonucu ve denetimi için gerekli sınırlı başvuru
            kayıtları saklanır.
          </p>
        </section>
      </div>
    </Container>
  );
}
