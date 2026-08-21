"use client";

import { useEffect, useState } from "react";
import { Instagram, Loader2, Pencil, Plus, User, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/src/presentation/components/ui/button";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import {
  useCouples,
  useCreateCouple,
  useUpdateCouple,
} from "@/src/application/hooks/use-wedding-query";
import type { CoupleResponse, CoupleSide } from "@/src/domain/services/wedding.service";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";

interface CoupleFormState {
  fullName: string;
  gelar: string;
  photoUrl: string;
  instagramHandle: string;
}

const EMPTY_FORM: CoupleFormState = { fullName: "", gelar: "", photoUrl: "", instagramHandle: "" };

function CoupleCard({
  side,
  label,
  couple,
  onEdit,
  onCreate,
}: {
  side: CoupleSide;
  label: string;
  couple?: CoupleResponse;
  onEdit: (couple: CoupleResponse) => void;
  onCreate: (side: CoupleSide) => void;
}) {
  const igHandle = couple?.instagram_handle?.replace(/^@/, "");

  if (!couple) {
    return (
      <button
        onClick={() => onCreate(side)}
        className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center transition-all hover:border-primary/40 hover:bg-muted/40 active:scale-95"
      >
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-[12px] font-semibold text-foreground">Belum diisi</span>
        <span className="text-[11px] text-muted-foreground">Ketuk untuk mengisi</span>
      </button>
    );
  }

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
      {couple.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={couple.photo_url}
          alt={couple.full_name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <User className="h-14 w-14 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">{label}</p>
        <p className="truncate text-[13px] font-bold text-white">{couple.full_name}</p>
        {couple.gelar && (
          <p className="line-clamp-2 text-[11px] leading-snug text-white/75">{couple.gelar}</p>
        )}
        {igHandle && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <Instagram className="h-3 w-3" />@{igHandle}
          </span>
        )}
      </div>
      <Button
        variant="soft"
        size="icon"
        aria-label={`Edit ${label}`}
        onClick={() => onEdit(couple)}
        className="absolute right-2 top-2 h-8 w-8 shrink-0 rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function CouplesTab() {
  const { data, isLoading } = useCouples();
  const createCouple = useCreateCouple();
  const updateCouple = useUpdateCouple();

  const [editing, setEditing] = useState<CoupleSide | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<CoupleFormState>(EMPTY_FORM);

  const pria = data?.find((c) => c.side === "pria");
  const wanita = data?.find((c) => c.side === "wanita");

  useEffect(() => {
    if (!editing || !data) return;
    const current = data.find((c) => c.side === editing);
    setExistingId(current?.id ?? null);
    setForm(
      current
        ? {
            fullName: current.full_name,
            gelar: current.gelar ?? "",
            photoUrl: current.photo_url ?? "",
            instagramHandle: current.instagram_handle ?? "",
          }
        : EMPTY_FORM
    );
  }, [editing]);

  const handleSave = () => {
    if (!form.fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    const payload = {
      full_name: form.fullName.trim(),
      gelar: form.gelar.trim() || null,
      photo_url: form.photoUrl.trim() || null,
      instagram_handle: form.instagramHandle.trim() || null,
    };

    if (existingId) {
      updateCouple.mutate(
        { id: existingId, req: payload },
        {
          onSuccess: () => {
            toast.success("Data mempelai tersimpan");
            setEditing(null);
          },
          onError: () => toast.error("Gagal menyimpan data mempelai"),
        }
      );
    } else if (editing) {
      createCouple.mutate(
        { side: editing, ...payload },
        {
          onSuccess: () => {
            toast.success("Data mempelai tersimpan");
            setEditing(null);
          },
          onError: () => toast.error("Gagal menyimpan data mempelai"),
        }
      );
    }
  };

  if (isLoading) return <TabLoading />;

  const isPending = createCouple.isPending || updateCouple.isPending;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <CoupleCard side="pria" label="Mempelai Pria" couple={pria} onEdit={(c) => setEditing(c.side)} onCreate={(s) => setEditing(s)} />
        <CoupleCard side="wanita" label="Mempelai Wanita" couple={wanita} onEdit={(c) => setEditing(c.side)} onCreate={(s) => setEditing(s)} />
      </div>

      {/* Bottom sheet edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setEditing(null)} />
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                {editing === "pria" ? "Mempelai Pria" : "Mempelai Wanita"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <Label htmlFor="couple-name" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Lengkap</Label>
                <Input
                  id="couple-name"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nama lengkap beserta gelar akademik"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="couple-gelar" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Gelar / Sebutan</Label>
                <Input
                  id="couple-gelar"
                  value={form.gelar}
                  onChange={(e) => setForm((f) => ({ ...f, gelar: e.target.value }))}
                  placeholder="Putra pertama dari Bpk. ... & Ibu ..."
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Path Foto</Label>
                <MediaInput
                  value={form.photoUrl || null}
                  onChange={(v) => setForm((f) => ({ ...f, photoUrl: v ?? "" }))}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  folder="couples"
                  preview="image"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="couple-ig" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Instagram</Label>
                <Input
                  id="couple-ig"
                  value={form.instagramHandle}
                  onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
                  placeholder="@username"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
