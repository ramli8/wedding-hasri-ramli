"use client";

import { useRef, useState } from "react";
import { FileAudio, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/src/infrastructure/stores/auth-store";
import { Button } from "@/src/presentation/components/ui/button";
import { cn } from "@/src/lib/utils";

interface MediaInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept: string;
  folder: string;
  label?: string;
  /** Hint ukuran file yang direkomendasikan, cth: "Rekomendasi 800 × 800 px" */
  hint?: string;
  preview?: "image" | "audio" | "none";
  className?: string;
}

export function MediaInput({
  value,
  onChange,
  accept,
  folder,
  label,
  hint,
  preview = "image",
  className,
}: MediaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const { accessToken } = useAuthStore.getState();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal mengunggah");
      }
      const { path } = await res.json();
      onChange(path);
      toast.success("File terunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">{label}</label>
      )}
      {hint && (
        <p className="-mt-0.5 pl-1 text-[10px] font-medium tracking-wide text-muted-foreground/70">{hint}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {preview === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            )}
            {preview === "audio" && <FileAudio className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{value}</p>
          <Button
            variant="soft"
            size="icon"
            aria-label="Hapus file"
            onClick={() => onChange(null)}
            disabled={uploading}
            className="shrink-0 active:scale-95 transition-all"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-all hover:bg-muted/40 active:scale-[0.98]"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[12px] font-semibold">Mengunggah...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-[12px] font-semibold">Pilih File</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
