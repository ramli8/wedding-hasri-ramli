import { useMutation } from "@tanstack/react-query";
import { MAX_UPLOAD_MB, type MediaRef } from "@wedding/shared";
import { ImagePlus, Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { adminApi } from "../lib/admin-api.js";

/**
 * Pilih dan unggah satu foto. Berkas dikirim langsung ke server dengan resolusi asli; yang
 * disimpan di formulir hanya rujukan gambarnya. Gambar yang diunggah tetapi tidak disimpan
 * disapu server nanti, jadi membatalkan formulir tidak meninggalkan sampah.
 */
export function ImageField({
  label,
  value,
  onChange,
  recommendation,
}: {
  label: string;
  /** Saran ukuran dan rasio untuk tempat foto ini ditampilkan, mis. "Potret 4:5, 1600 × 2000 px". */
  recommendation?: string;
  value: MediaRef | null;
  onChange: (value: MediaRef | null) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => adminApi.media.upload(file),
    onSuccess: ({ media }) => onChange(media),
  });

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-none font-medium">
        {label}
      </label>
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start">
        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted/40">
          {value ? (
            <img
              src={value.thumb}
              alt=""
              width={value.width}
              height={value.height}
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) upload.mutate(file);
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => input.current?.click()}
              disabled={upload.isPending}
            >
              <ImagePlus className="size-4" aria-hidden />
              {upload.isPending ? "Mengunggah…" : value ? "Ganti foto" : "Pilih foto"}
            </Button>
            {value && !upload.isPending && (
              <Button size="sm" variant="destructive" onClick={() => onChange(null)}>
                <Trash2 className="size-4" aria-hidden />
                Lepas
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, atau WebP, maksimal {MAX_UPLOAD_MB} MB. Resolusi dan detail foto
            dipertahankan.
          </p>
          {recommendation && (
            <p className="max-w-prose text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Disarankan:</span> {recommendation}
            </p>
          )}
        </div>
      </div>
      {upload.error && <Alert tone="error">{upload.error.message}</Alert>}
    </div>
  );
}
