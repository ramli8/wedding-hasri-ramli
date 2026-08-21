"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import { useUpdateWedding } from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse, OpeningContent } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";

const EMPTY: OpeningContent = {
  eyebrow: null,
  arabic: null,
  translation: null,
  source: null,
  greeting: null,
};

export function OpeningForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [form, setForm] = useState<OpeningContent>(EMPTY);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setForm({ ...EMPTY, ...(data.content?.opening ?? {}) });
      setInitialized(true);
    }
  }, [data, initialized]);

  const set = (patch: Partial<OpeningContent>) =>
    setForm((f) => ({ ...f, ...patch }));

  const handleSave = () => {
    updateWedding.mutate(buildSaveRequest(data, { content: { opening: form } }), {
      onSuccess: () => toast.success("Bagian pembuka tersimpan"),
      onError: () => toast.error("Gagal menyimpan bagian pembuka"),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="eyebrow" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Label Kecil
            </Label>
            <Input
              id="eyebrow"
              value={form.eyebrow ?? ""}
              onChange={(e) => set({ eyebrow: e.target.value.trim() || null })}
              placeholder="Firman Allah"
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arabic" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Teks Arab
            </Label>
            <Textarea
              id="arabic"
              value={form.arabic ?? ""}
              onChange={(e) => set({ arabic: e.target.value.trim() || null })}
              rows={3}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="translation" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Terjemahan
            </Label>
            <Textarea
              id="translation"
              value={form.translation ?? ""}
              onChange={(e) => set({ translation: e.target.value.trim() || null })}
              rows={3}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Sumber Ayat
            </Label>
            <Input
              id="source"
              value={form.source ?? ""}
              onChange={(e) => set({ source: e.target.value.trim() || null })}
              placeholder="QS. Ar-Rum: 21"
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="greeting" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Salam Pembuka
            </Label>
            <Textarea
              id="greeting"
              value={form.greeting ?? ""}
              onChange={(e) => set({ greeting: e.target.value.trim() || null })}
              rows={2}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleSave}
        disabled={updateWedding.isPending}
        className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
      >
        {updateWedding.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Simpan"
        )}
      </button>
    </div>
  );
}
