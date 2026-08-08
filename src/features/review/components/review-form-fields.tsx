import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScoreField } from "@/features/review/components/score-field";
import type { ReviewWithScores } from "@/types";

/**
 * Değerlendirme formunun alanları — hem yeni gönderim hem düzenleme
 * sayfasında kullanılıyor (kod tekrarını önlemek için). `defaults`
 * verilirse alanlar önceden doldurulur (düzenleme senaryosu).
 */
export function ReviewFormFields({ defaults }: { defaults?: ReviewWithScores }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="monthlyShifts">Aylık nöbet</Label>
          <Input
            id="monthlyShifts"
            name="monthlyShifts"
            type="number"
            min={0}
            max={60}
            defaultValue={defaults?.monthlyShifts}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dailyPatients">Günlük hasta</Label>
          <Input
            id="dailyPatients"
            name="dailyPatients"
            type="number"
            min={0}
            max={500}
            defaultValue={defaults?.dailyPatients}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="servicePatients">Servis hasta</Label>
          <Input
            id="servicePatients"
            name="servicePatients"
            type="number"
            min={0}
            max={500}
            defaultValue={defaults?.servicePatients}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tekrar tercih eder misin?</Label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="wouldChooseAgain"
              value="true"
              defaultChecked={defaults?.wouldChooseAgain === true}
              required
            />
            Evet
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="wouldChooseAgain"
              value="false"
              defaultChecked={defaults?.wouldChooseAgain === false}
            />
            Hayır
          </label>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <ScoreField
          name="incentiveScore"
          label="Döner sermaye / ek ödeme (finansal memnuniyet)"
          defaultValue={defaults?.incentiveScore}
        />
        <ScoreField
          name="colleagueScore"
          label="Meslektaş ilişkileri / sosyal ortam"
          defaultValue={defaults?.colleagueScore}
        />
        <ScoreField
          name="managementScore"
          label="Yönetim desteği"
          defaultValue={defaults?.managementScore}
        />
        <ScoreField
          name="cityScore"
          label="Şehir / yaşam kalitesi"
          defaultValue={defaults?.cityScore}
        />
        <ScoreField
          name="educationScore"
          label="Eğitim kalitesi"
          defaultValue={defaults?.educationScore}
        />
        <ScoreField
          name="academicScore"
          label="Akademik fırsatlar"
          defaultValue={defaults?.academicScore}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment">Yorumun (opsiyonel)</Label>
        <Textarea
          id="comment"
          name="comment"
          maxLength={2000}
          rows={4}
          defaultValue={defaults?.comment ?? ""}
          placeholder="Nöbet düzeni, yönetim, çalışma ortamı… aklına geleni yaz."
        />
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-border bg-accent/40 px-3 py-2.5">
        <input
          type="checkbox"
          id="showNickname"
          name="showNickname"
          defaultChecked={defaults?.showNickname ?? false}
          className="mt-0.5 size-4 shrink-0 rounded border-input"
        />
        <Label htmlFor="showNickname" className="text-sm font-normal leading-relaxed">
          Rumuzumu bu yorumda göster
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
            İşaretlemezsen bu yorum tamamen anonim kalır. İşaretlersen, yalnızca
            bu yorumun yanında rumuzun görünür — gerçek adın, e-postan veya
            başka bir kimlik bilgin hiçbir zaman gösterilmez.
          </span>
        </Label>
      </div>

      <p className="text-xs text-muted-foreground">
        Kimliğin gösterilmez — yalnızca unvan/branşın (ve yukarıda seçersen rumuzun) görünür.
      </p>
    </>
  );
}
