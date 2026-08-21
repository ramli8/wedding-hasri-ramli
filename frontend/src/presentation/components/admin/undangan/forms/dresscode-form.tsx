"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/src/presentation/components/ui/button";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import { useUpdateWedding } from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";
import { MediaInput } from "../media-input";

export function DressCodeForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [description, setDescription] = useState("");
  const [palette, setPalette] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      const dressCode = data.content?.dress_code;
      setDescription(dressCode?.description ?? "");
      setPalette(dressCode?.color_palette?.length ? [...dressCode.color_palette] : []);
      setImageUrl(dressCode?.image_url ?? null);
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = () => {
    updateWedding.mutate(
      buildSaveRequest(data, {
        content: {
          dress_code: {
            description: description.trim() || null,
            color_palette: palette.filter((c) => c.trim() !== ""),
            image_url: imageUrl,
          },
        },
      }),
      {
        onSuccess: () => toast.success("Dress code tersimpan"),
        onError: () => toast.error("Gagal menyimpan dress code"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="dress-desc" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Deskripsi
            </Label>
            <Textarea
              id="dress-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Earth tone, sopan dan nyaman"
              rows={3}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Palet Warna (hex)
            </Label>
            <div className="space-y-2">
              {palette.map((color, i) => {
                const isValid = /^#[0-9a-fA-F]{6}$/.test(color);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={`Warna ${i + 1}`}
                      value={isValid ? color.toLowerCase() : "#ffffff"}
                      onChange={(e) => {
                        const next = [...palette];
                        next[i] = e.target.value;
                        setPalette(next);
                      }}
                      className="h-10 w-10 shrink-0 cursor-pointer appearance-none rounded-lg border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
                    />
                    <Input
                      value={color}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const next = [...palette];
                        next[i] = raw && !raw.startsWith("#") ? `#${raw}` : raw;
                        setPalette(next);
                      }}
                      placeholder="#cc785c"
                      className="h-11 flex-1 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                    />
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label={`Hapus warna ${i + 1}`}
                      onClick={() => setPalette((p) => p.filter((_, j) => j !== i))}
                      className="shrink-0 active:scale-95 transition-all"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPalette((p) => [...p, ""])}
                className="active:scale-95 transition-all"
              >
                Tambah Warna
              </Button>
            </div>
          </div>

          <MediaInput
            label="Moodboard (opsional)"
            value={imageUrl}
            onChange={setImageUrl}
            accept="image/jpeg,image/png,image/webp,image/gif"
            folder="dresscode"
            preview="image"
          />
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
