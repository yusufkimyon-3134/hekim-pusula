"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const DELETE_CONFIRMATION = "SİL";

export function DeleteAccountCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (confirmation !== DELETE_CONFIRMATION || isDeleting) return;

    setError(null);
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.functions.invoke(
        "delete-account",
        { body: { confirmation } }
      );

      if (deleteError) {
        setError("Hesabın silinemedi. Lütfen tekrar dene.");
        return;
      }

      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/login?accountDeleted=1");
    } catch {
      setError("Hesabın silinirken beklenmeyen bir hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Hesabı sil</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hesabını ve sana bağlı profil verilerini kalıcı olarak silebilirsin.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOpen ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsOpen(true)}
          >
            <Trash2 />
            Hesabımı sil
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>
                Bu işlem geri alınamaz. Profilin, yorumların, oyların,
                favorilerin ve yüklediğin doğrulama belgeleri kalıcı olarak
                silinir.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirmation">
                Onaylamak için <strong>{DELETE_CONFIRMATION}</strong> yaz
              </Label>
              <Input
                id="deleteConfirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                disabled={isDeleting}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmation("");
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={confirmation !== DELETE_CONFIRMATION || isDeleting}
              >
                <Trash2 />
                {isDeleting ? "Hesap siliniyor..." : "Hesabımı kalıcı olarak sil"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
