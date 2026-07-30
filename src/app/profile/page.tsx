import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReputationBadge } from "@/components/reputation-badge";
import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { DOCTOR_ROLE_OPTIONS } from "@/lib/doctor-role";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { saveProfile } from "./actions";

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { year: "numeric", month: "long" });
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; redirectTo?: string }>;
}) {
  const { error, saved, redirectTo } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(safeRedirectPath(redirectTo, "/profile"))}`
    );
  }

  const doctorRepository = new DoctorRepository(supabase);
  const [doctor, reputation] = await Promise.all([
    doctorRepository.findById(userData.user.id),
    doctorRepository.getMyReputation(),
  ]);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profilim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor
              ? "Bilgilerini güncelle."
              : "Deneyim paylaşabilmek için profilini tamamla."}
          </p>
        </div>

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
                  <p className="text-muted-foreground">Yazılan yorum</p>
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

        {redirectTo && !doctor && (
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            Devam edebilmek için önce profilini tamamlaman gerekiyor.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilgilerin</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveProfile} className="space-y-4">
              <input
                type="hidden"
                name="redirectTo"
                value={safeRedirectPath(redirectTo, "/profile?saved=1")}
              />

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {saved && !error && (
                <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                  Profilin kaydedildi.
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nickname">Rumuz</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  defaultValue={doctor?.nickname}
                  placeholder="Diğer hekimlere böyle görüneceksin"
                  maxLength={40}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Unvan</Label>
                  <NativeSelect
                    id="role"
                    name="role"
                    defaultValue={doctor?.role ?? "specialist"}
                    required
                  >
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
                    maxLength={80}
                    required
                  />
                </div>
              </div>

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
                  placeholder="Opsiyonel, kendi beyanın (doğrulanmaz)"
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

              <Button type="submit" className="w-full">
                Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
