"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/src/domain/services/api-client";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import {
  useCouples,
  useUpdateCouple,
  useUpdateWedding,
} from "@/src/application/hooks/use-wedding-query";
import type { WeddingResponse } from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";
import { MediaInput } from "../media-input";

interface CoverSlot {
  key: "image_desktop" | "image_tablet" | "image_mobile";
  device: string;
  recommendation: string;
}

const COVER_SLOTS: CoverSlot[] = [
  {
    key: "image_desktop",
    device: "Desktop / PC",
    recommendation: "1920 × 1080 px (landscape 16:9)",
  },
  {
    key: "image_tablet",
    device: "Tablet",
    recommendation: "1280 × 960 px (4:3)",
  },
  {
    key: "image_mobile",
    device: "Mobile / HP",
    recommendation: "1080 × 1920 px (portrait 9:16)",
  },
];

export function CoverForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const updateCouple = useUpdateCouple();
  const couples = useCouples();
  const [images, setImages] = useState<Record<CoverSlot["key"], string>>({
    image_desktop: "",
    image_tablet: "",
    image_mobile: "",
  });
  const [buttonText, setButtonText] = useState("Buka Undangan");
  const [saveTheDateLabel, setSaveTheDateLabel] = useState("");
  const [guestGreetingLabel, setGuestGreetingLabel] = useState("");
  const [groomNickname, setGroomNickname] = useState("");
  const [brideNickname, setBrideNickname] = useState("");
  const [initialized, setInitialized] = useState(false);

  const couplePria = couples.data?.find((c) => c.side === "pria");
  const coupleWanita = couples.data?.find((c) => c.side === "wanita");

  useEffect(() => {
    if (!initialized) {
      if (data) {
        const cover = data.content?.cover;
        setImages({
          image_desktop: cover?.image_desktop ?? "",
          image_tablet: cover?.image_tablet ?? "",
          image_mobile: cover?.image_mobile ?? "",
        });
        setButtonText(cover?.button_text || "Buka Undangan");
        setSaveTheDateLabel(cover?.save_the_date_label ?? "");
        setGuestGreetingLabel(cover?.guest_greeting_label ?? "");
      }
      if (couples.data) {
        setGroomNickname(couplePria?.nickname ?? "");
        setBrideNickname(coupleWanita?.nickname ?? "");
      }
      if (data && couples.data !== undefined) setInitialized(true);
    }
  }, [data, couples.data, initialized, couplePria, coupleWanita]);

  const handleSave = async () => {
    try {
      await updateWedding.mutateAsync(
        buildSaveRequest(data, {
          content: {
            cover: {
              image_desktop: images.image_desktop.trim(),
              image_tablet: images.image_tablet.trim(),
              image_mobile: images.image_mobile.trim(),
              button_text: buttonText.trim() || "Buka Undangan",
              save_the_date_label: saveTheDateLabel.trim() || null,
              guest_greeting_label: guestGreetingLabel.trim() || null,
            },
          },
        })
      );

      // Bersihkan file lama yang tidak lagi dipakai slot mana pun
      // agar folder public/uploads tidak membengkak.
      const previousCover = data?.content?.cover;
      const finalUrls = new Set(
        [
          images.image_desktop.trim(),
          images.image_tablet.trim(),
          images.image_mobile.trim(),
        ].filter(Boolean)
      );
      const previousUrls = [
        previousCover?.image_desktop,
        previousCover?.image_tablet,
        previousCover?.image_mobile,
      ].filter((url): url is string => Boolean(url));
      const staleUploads = previousUrls.filter(
        (url) => url.startsWith("/uploads/") && !finalUrls.has(url)
      );
      await Promise.all(
        staleUploads.map((url) =>
          apiClient.delete("/upload", { params: { url } }).catch(() => undefined)
        )
      );

      // Nama panggilan tampil di cover — kelola dari sini, bukan menu mempelai.
      if (couplePria) {
        await updateCouple.mutateAsync({
          id: couplePria.id,
          req: { nickname: groomNickname.trim() || null },
        });
      }
      if (coupleWanita) {
        await updateCouple.mutateAsync({
          id: coupleWanita.id,
          req: { nickname: brideNickname.trim() || null },
        });
      }
      toast.success("Cover tersimpan");
    } catch {
      toast.error("Gagal menyimpan cover");
    }
  };

  const isSaving = updateWedding.isPending || updateCouple.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Foto Cover (3 perangkat)
          </p>
          {COVER_SLOTS.map((slot) => (
            <div key={slot.key} className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-foreground/90">
                {slot.device}
              </Label>
              <MediaInput
                value={images[slot.key]}
                onChange={(v) =>
                  setImages((prev) => ({ ...prev, [slot.key]: v ?? "" }))
                }
                accept="image/jpeg,image/png,image/webp"
                folder="cover"
                preview="image"
              />
              <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
                Rekomendasi:{" "}
                <span className="font-medium text-foreground/80">
                  {slot.recommendation}
                </span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nama Mempelai di Cover
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="groom-nickname" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Panggilan Mempelai Pria
            </Label>
            <Input
              id="groom-nickname"
              value={groomNickname}
              onChange={(e) => setGroomNickname(e.target.value)}
              placeholder={couplePria ? couplePria.full_name : "Data mempelai belum ada"}
              disabled={!couplePria}
              className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary disabled:opacity-60"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bride-nickname" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Panggilan Mempelai Wanita
            </Label>
            <Input
              id="bride-nickname"
              value={brideNickname}
              onChange={(e) => setBrideNickname(e.target.value)}
              placeholder={coupleWanita ? coupleWanita.full_name : "Data mempelai belum ada"}
              disabled={!coupleWanita}
              className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary disabled:opacity-60"
            />
          </div>
          <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Ditampilkan besar di cover. Kosong → memakai nama lengkap dari menu Mempelai.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Teks &amp; Label
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="button-text" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Teks Tombol Buka
            </Label>
            <Input
              id="button-text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Buka Undangan"
              className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="save-the-date" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Baris Bawah Tanggal
            </Label>
            <Input
              id="save-the-date"
              value={saveTheDateLabel}
              onChange={(e) => setSaveTheDateLabel(e.target.value)}
              placeholder="Kosongkan = nama venue acara utama"
              className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary"
            />
            <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
              Contoh: The Grand Ballroom, Kota Bandung.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-greeting" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sapaan Tamu
            </Label>
            <Input
              id="guest-greeting"
              value={guestGreetingLabel}
              onChange={(e) => setGuestGreetingLabel(e.target.value)}
              placeholder="Kepada Yth."
              className="h-11 rounded-xl border-border/60 bg-muted/20 text-[13px] shadow-none focus-visible:ring-primary"
            />
            <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
              Nama tamu mengikuti link personal masing-masing.
            </p>
          </div>
        </CardContent>
      </Card>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Simpan"
        )}
      </button>
    </div>
  );
}
