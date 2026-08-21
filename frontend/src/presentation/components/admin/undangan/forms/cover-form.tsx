"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/src/presentation/components/ui/button";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { useUpdateWedding } from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";
import { MediaInput } from "../media-input";

export function CoverForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [photos, setPhotos] = useState<string[]>([]);
  const [buttonText, setButtonText] = useState("Buka Undangan");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      const cover = data.content?.cover;
      setPhotos(cover?.photos?.length ? [...cover.photos] : []);
      setButtonText(cover?.button_text || "Buka Undangan");
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = () => {
    updateWedding.mutate(
      buildSaveRequest(data, {
        content: {
          cover: {
            photos: photos.filter((p) => p.trim() !== ""),
            button_text: buttonText.trim() || "Buka Undangan",
          },
        },
      }),
      {
        onSuccess: () => toast.success("Cover tersimpan"),
        onError: () => toast.error("Gagal menyimpan cover"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Foto Cover
          </p>
          {photos.map((photo, i) => (
            <MediaInput
              key={i}
              value={photo}
              onChange={(v) => {
                const next = [...photos];
                next[i] = v ?? "";
                setPhotos(next);
              }}
              accept="image/jpeg,image/png,image/webp,image/gif"
              folder="cover"
              preview="image"
            />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPhotos((p) => [...p, ""])}
            className="active:scale-95 transition-all"
          >
            Tambah Foto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 p-4">
          <Label htmlFor="button-text" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
            Teks Tombol Buka
          </Label>
          <Input
            id="button-text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Buka Undangan"
            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
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
