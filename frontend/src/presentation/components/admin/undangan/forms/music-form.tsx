"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { useUpdateWedding } from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";
import { MediaInput } from "../media-input";

export function MusicForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setFileUrl(data.content?.music?.file_url ?? null);
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = () => {
    updateWedding.mutate(
      buildSaveRequest(data, { content: { music: { file_url: fileUrl } } }),
      {
        onSuccess: () => toast.success("Musik latar tersimpan"),
        onError: () => toast.error("Gagal menyimpan musik latar"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <MediaInput
            label="Musik Latar"
            value={fileUrl}
            onChange={setFileUrl}
            accept="audio/mpeg,audio/mp4,audio/ogg"
            folder="music"
            preview="audio"
          />
          {fileUrl && (
            <audio controls src={fileUrl} className="mt-3 w-full" />
          )}
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
