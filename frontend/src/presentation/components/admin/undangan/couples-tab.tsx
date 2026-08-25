"use client";

import { useEffect, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/src/domain/services/api-client";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import {
  useCreateCouple,
  useCouples,
  useUpdateCouple,
} from "@/src/application/hooks/use-wedding-query";
import type {
  CoupleResponse,
  CoupleSide,
} from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";

// Rasio sama dengan tampilan publik (aspect 3/4, portrait).
const PHOTO_RECOMMENDATION = "1200 × 1600 px (rasio 3:4, portrait)";

interface SideFormState {
  fullName: string;
  gelar: string;
  photoUrl: string;
  instagramHandle: string;
}

const EMPTY_SIDE: SideFormState = {
  fullName: "",
  gelar: "",
  photoUrl: "",
  instagramHandle: "",
};

function CoupleEditor({
  side,
  label,
  couple,
}: {
  side: CoupleSide;
  label: string;
  couple?: CoupleResponse;
}) {
  const createCouple = useCreateCouple();
  const updateCouple = useUpdateCouple();
  const [form, setForm] = useState<SideFormState>(EMPTY_SIDE);
  const [syncedId, setSyncedId] = useState<string | null>(null);

  // Sinkronkan form saat data dari server berubah (load/refetch/setelah simpan).
  useEffect(() => {
    setForm(
      couple
        ? {
            fullName: couple.full_name,
            gelar: couple.gelar ?? "",
            photoUrl: couple.photo_url ?? "",
            instagramHandle: couple.instagram_handle ?? "",
          }
        : EMPTY_SIDE
    );
    setSyncedId(couple?.id ?? null);
  }, [couple]);

  const isPending = createCouple.isPending || updateCouple.isPending;
  const igHandle = form.instagramHandle.replace(/^@/, "");

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.error(`Nama lengkap ${label.toLowerCase()} wajib diisi`);
      return;
    }

    const finalPhotoUrl = form.photoUrl.trim() || null;
    const payload = {
      full_name: form.fullName.trim(),
      gelar: form.gelar.trim() || null,
      photo_url: finalPhotoUrl,
      instagram_handle: form.instagramHandle.trim() || null,
    };

    try {
      if (syncedId) {
        await updateCouple.mutateAsync({ id: syncedId, req: payload });
      } else {
        await createCouple.mutateAsync({ side, ...payload });
      }

      // Foto lama yang diganti/kosongkan ikut dihapus dari public/uploads.
      const previousUrl = couple?.photo_url;
      if (
        previousUrl &&
        previousUrl.startsWith("/uploads/") &&
        previousUrl !== finalPhotoUrl
      ) {
        apiClient
          .delete("/upload", { params: { url: previousUrl } })
          .catch(() => undefined);
      }

      toast.success(`${label} tersimpan`);
    } catch {
      toast.error(`Gagal menyimpan ${label.toLowerCase()}`);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-border bg-card">
      <header className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-foreground/80">
          {label}
        </h3>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </header>

      <div className="flex flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <Label className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Foto
          </Label>
          <MediaInput
            value={form.photoUrl || null}
            onChange={(v) => setForm((f) => ({ ...f, photoUrl: v ?? "" }))}
            accept="image/jpeg,image/png,image/webp"
            folder="couples"
            preview="image"
          />
          <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Rekomendasi:{" "}
            <span className="font-medium text-foreground/80">{PHOTO_RECOMMENDATION}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${side}-name`} className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nama Lengkap
          </Label>
          <Input
            id={`${side}-name`}
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="Nama lengkap beserta gelar akademik"
            className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${side}-gelar`} className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Anak dari / Gelar
          </Label>
          <Input
            id={`${side}-gelar`}
            value={form.gelar}
            onChange={(e) => setForm((f) => ({ ...f, gelar: e.target.value }))}
            placeholder="Putra pertama dari Bpk. … & Ibu …"
            className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${side}-ig`} className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Instagram
          </Label>
          <div className="relative">
            <Instagram
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={`${side}-ig`}
              value={form.instagramHandle}
              onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
              placeholder="@username"
              className="h-11 rounded-xl border-border/60 bg-muted/20 pl-11 pr-4 text-[13px] shadow-none focus-visible:ring-primary"
            />
          </div>
          {igHandle ? (
            <p className="pl-1 text-[10.5px] text-muted-foreground">
              Pratinjau tautan: instagram.com/{igHandle}
            </p>
          ) : null}
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="mt-1 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : syncedId ? (
            "Simpan Perubahan"
          ) : (
            "Simpan"
          )}
        </button>
      </div>
    </section>
  );
}

export function CouplesTab() {
  const { data, isLoading } = useCouples();

  if (isLoading) return <TabLoading />;

  const pria = data?.find((c) => c.side === "pria");
  const wanita = data?.find((c) => c.side === "wanita");

  return (
    <div className="space-y-4">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Data di sini tampil di section Mempelai pada halaman undangan. Nama panggilan untuk
        cover diatur di menu Cover.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <CoupleEditor side="pria" label="Mempelai Pria" couple={pria} />
        <CoupleEditor side="wanita" label="Mempelai Wanita" couple={wanita} />
      </div>
    </div>
  );
}
