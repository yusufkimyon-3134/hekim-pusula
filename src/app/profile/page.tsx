import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReputationBadge } from "@/components/reputation-badge";
import { VerificationCard } from "@/features/profile/components/verification-card";
import { DeleteAccountCard } from "@/features/profile/components/delete-account-card";
import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { DoctorVerificationRepository } from "@/lib/repositories/doctor-verification-repository";
import { DOCTOR_ROLE_OPTIONS } from "@/lib/doctor-role";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { safeQuery } from "@/lib/safe-query";
import { saveProfile } from "./actions";

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "long" });
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    redirectTo?: string;
    verificationError?: string;
    verificationSubmitted?: string;
  }>;
}) {
  const { error, saved, redirectTo, verificationError, verificationSubmitted } =
    await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(safeRedirectPath(redirectTo, "/profile"))}`
    );
  }

  const requestedDestination = safeRedirectPath(redirectTo, "");
  const returnCookie = (await cookies()).get("verification-return")?.value ?? "";
  const ownerPrefix = `${userData.user.id}:`;
  const rememberedDestination = returnCookie.startsWith(ownerPrefix)
    ? safeRedirectPath(returnCookie.slice(ownerPrefix.length), "")
    : "";

  const doctorRepository = new DoctorRepository(supabase);
  const verificationRepository = new DoctorVerificationRepository(supabase);
  // Her sorgu ayrı ayrı safeQuery ile sarılı: bunlardan biri (örn.
  // henüz uygulanmamış bir migration yüzünden — canlıda şema kod ile
  // senkron değilse) beklenmeyen bir DB hatası verirse, TÜM sayfa
  // çökmek yerine o bölüm boş/varsayılan durumda kalır. Bu, e-posta
  // aktivasyonundan sonra ilk kez /profile'a düşen kullanıcılar için
  // özellikle kritik — bu an, sayfanın en sık ve en riskli çalıştığı an.
  const [doctor, reputation, latestVerificationRequest] = await Promise.all([
    safeQuery(() => doctorRepository.findById(userData.user.id), null),
    safeQuery(() => doctorRepository.getMyReputation(), null),
    safeQuery(() => verificationRepository.findLatestRequest(userData.user.id), null),
  ]);


  if (doctor?.isVerified && /^\/(clinic|hospital)\//.test(requestedDestination)) {
    redirect(requestedDestination);
  }

  const profileForm = (
    <form action={saveProfile} className="space-y-4">
      <input
        type="hidden"
        name="redirectTo"
        value={requestedDestination}
      />

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {doctor && saved && !error && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          Profil bilgilerin kaydedildi.
          {!doctor.isVerified && (
            <a href="#hekim-dogrulama" className="mt-1 block font-medium underline underline-offset-4">
              Hekim hesabını doğrula
            </a>
          )}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nickname">Rumuz</Label>
        <Input
          id="nickname"
          name="nickname"
          defaultValue={doctor?.nickname}
          placeholder={doctor ? "Diğer hekimlere böyle görüneceksin" : "Rumuzunu yaz"}
          className={doctor ? undefined : "h-11 text-base"}
          maxLength={40}
          required
        />
      </div>

      <div className={doctor ? "grid grid-cols-2 gap-3" : "space-y-4"}>
        <div className="space-y-1.5">
          <Label htmlFor="role">Unvan</Label>
          <NativeSelect
            id="role"
            name="role"
            defaultValue={doctor?.role ?? ""}
            className={doctor ? undefined : "h-11 text-base"}
            required
          >
            {!doctor && <option value="" disabled>Unvan seç</option>}
            {DOCTOR_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialty">Branş</Label>
          <Input
            id="specialty"
            name="specialty"
            defaultValue={doctor?.specialty}
            placeholder="Örn. İç Hastalıkları"
            className={doctor ? undefined : "h-11 text-base"}
            maxLength={80}
            required
          />
        </div>
      </div>

      {doctor && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                name="city"
                defaultValue={doctor?.city ?? ""}
                placeholder="Opsiyonel"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experienceYear">Deneyim (yıl)</Label>
              <Input
                id="experienceYear"
                name="experienceYear"
                type="number"
                min={0}
                max={60}
                defaultValue={doctor?.experienceYear ?? ""}
                placeholder="Opsiyonel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="currentHospital">Şu an çalıştığın kurum</Label>
            <Input
              id="currentHospital"
              name="currentHospital"
              defaultValue={doctor?.currentHospital ?? ""}
              placeholder="Örn. Reyhanlı Devlet Hastanesi"
              maxLength={160}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Hakkında</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={doctor?.bio ?? ""}
              placeholder="Opsiyonel, kısa bir tanıtım"
              maxLength={500}
              rows={3}
            />
          </div>
        </>
      )}

      <Button type="submit" className="min-h-11 w-full">
        {doctor ? "Profil bilgilerini kaydet" : "Profili oluştur"}
      </Button>
    </form>
  );

  if (!doctor) {
    return (
      <Container className="py-6 sm:py-12">
        <section id="profil-bilgileri" className="mx-auto max-w-sm space-y-5" aria-labelledby="profile-create-title">
          <h1 id="profile-create-title" className="text-2xl font-semibold tracking-tight">Profilini oluştur</h1>
          {profileForm}
        </section>
      </Container>
    );
  }

  // Sadece oturum sahibinin yorumları; doktor-işyeri ilişkisi üzerinden filtrelenir.
  const myReviews = await safeQuery(async () => {
    const { data: workplaces, error: workplaceError } = await supabase
      .from("doctor_workplaces")
      .select("id")
      .eq("doctor_id", userData.user.id);
    if (workplaceError) throw workplaceError;
    const ids = (workplaces ?? []).map((item) => item.id);
    if (!ids.length) return [];
    const { data, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, clinic_id, comment, created_at")
      .in("doctor_workplace_id", ids)
      .order("created_at", { ascending: false });
    if (reviewsError) throw reviewsError;
    return data ?? [];
  }, []);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profilim</h1>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {doctor.currentHospital || "Henüz çalıştığın kurumu eklemedin."}
            </p>
          </div>
          <Button asChild variant="outline" className="min-h-11">
            <a href="#profil-bilgileri">Profili güncelle</a>
          </Button>
        </div>

        {doctor?.isVerified && rememberedDestination && (
          <Button asChild><Link prefetch={false} href={rememberedDestination}>Baktığın sayfaya dön</Link></Button>
        )}

        {reputation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Katkı özetin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ReputationBadge
                reviewCount={reputation.reviewCount}
                helpfulVotes={reputation.helpfulVotes}
                isVerified={reputation.isVerified}
                showDetails
              />
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="font-mono text-lg font-semibold">
                    {reputation.reviewCount}
                  </p>
                  <a href="#yorumlarim" className="text-primary underline-offset-4 hover:underline">Yazılan yorum ↓</a>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold">
                    {reputation.helpfulVotes}
                  </p>
                  <p className="text-muted-foreground">Alınan faydalı oy</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold">
                    {reputation.reputationScore}
                  </p>
                  <p className="text-muted-foreground">İtibar puanı</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {formatMemberSince(reputation.memberSince)} tarihinden beri üye
              </p>
            </CardContent>
          </Card>
        )}


        {doctor?.isVerified && (
          <Card id="yorumlarim" className="scroll-mt-6">
            <CardHeader><CardTitle className="text-base">Yorumlarım</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz yazdığın bir değerlendirme bulunmuyor.</p>
              ) : myReviews.map((review) => (
                <Link prefetch={false} key={review.id} href={`/clinic/${review.clinic_id}#review-${review.id}`}
                  className="block rounded-md border p-3 transition-colors hover:border-primary/50 hover:bg-accent/40">
                  <p className="text-sm font-medium">Yorumunu görüntüle →</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("tr-TR")}</p>
                  {review.comment && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{review.comment}</p>}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {saved && !error && !doctor.isVerified && (
          <Button asChild className="min-h-11">
            <a href="#hekim-dogrulama">Hekim hesabını doğrula</a>
          </Button>
        )}

        {redirectTo && doctor && !doctor.isVerified && (
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            Yorumları okumak ve deneyim paylaşmak için hekim doğrulamasına başvurabilirsin.
          </p>
        )}

        {doctor && (
          <>
            {verificationSubmitted && !verificationError && (
              <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                Doğrulama başvurun alındı, inceleniyor.
              </p>
            )}
            {verificationError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {verificationError}
              </p>
            )}
            <div id="hekim-dogrulama" className="scroll-mt-6">
              <VerificationCard
                isVerified={doctor.isVerified}
                latestRequest={latestVerificationRequest}
                returnTo={requestedDestination || rememberedDestination}
              />
            </div>
          </>
        )}

        <Card id="profil-bilgileri" className="scroll-mt-6">
          <CardHeader>
            <CardTitle className="text-base">Profil bilgilerin</CardTitle>
          </CardHeader>
          <CardContent>
            {profileForm}
          </CardContent>
        </Card>

        <DeleteAccountCard />
      </div>
    </Container>
  );
}

