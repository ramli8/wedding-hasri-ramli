"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import { useUpdateWedding } from "@/src/application/hooks/use-wedding-query";
import type {
  WeddingResponse,
  LivestreamContent,
  FooterContent,
} from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "../wedding-save";

const EMPTY_LIVE: LivestreamContent = {
  platform: null,
  url: null,
  datetime: null,
  notes: null,
};

const EMPTY_FOOTER: FooterContent = {
  thank_you_message: null,
  made_by_credit: null,
  social_links: [],
};

export function LivestreamFooterForm({ data }: { data?: WeddingResponse }) {
  const updateWedding = useUpdateWedding();
  const [live, setLive] = useState<LivestreamContent>(EMPTY_LIVE);
  const [footer, setFooter] = useState<FooterContent>(EMPTY_FOOTER);
  const [liveDatetime, setLiveDatetime] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      setLive({ ...EMPTY_LIVE, ...(data.content?.livestream ?? {}) });
      setFooter({ ...EMPTY_FOOTER, ...(data.content?.footer ?? {}) });
      const iso = data.content?.livestream?.datetime ?? null;
    if (iso) {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      setLiveDatetime(
        Number.isNaN(d.getTime())
          ? ""
          : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    } else {
      setLiveDatetime("");
    }
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = () => {
    const parsed = liveDatetime
      ? (() => {
          const d = new Date(liveDatetime);
          return Number.isNaN(d.getTime()) ? "invalid" : d.toISOString();
        })()
      : null;
    if (parsed === "invalid") {
      toast.error("Waktu streaming tidak valid");
      return;
    }
    updateWedding.mutate(
      buildSaveRequest(data, {
        content: {
          livestream: {
            ...live,
            datetime: parsed,
          },
          footer,
        },
      }),
      {
        onSuccess: () => toast.success("Live streaming & penutup tersimpan"),
        onError: () => toast.error("Gagal menyimpan perubahan"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live Streaming (opsional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ls-platform" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                Platform
              </Label>
              <Input
                id="ls-platform"
                value={live.platform ?? ""}
                onChange={(e) =>
                  setLive((f) => ({ ...f, platform: e.target.value.trim() || null }))
                }
                placeholder="YouTube"
                className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ls-datetime" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                Waktu
              </Label>
              <Input
                id="ls-datetime"
                type="datetime-local"
                value={liveDatetime}
                onChange={(e) => setLiveDatetime(e.target.value)}
                className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ls-url" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              URL Stream
            </Label>
            <Input
              id="ls-url"
              value={live.url ?? ""}
              onChange={(e) => setLive((f) => ({ ...f, url: e.target.value.trim() || null }))}
              placeholder="https://youtube.com/watch?v=..."
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ls-notes" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Catatan
            </Label>
            <Input
              id="ls-notes"
              value={live.notes ?? ""}
              onChange={(e) => setLive((f) => ({ ...f, notes: e.target.value.trim() || null }))}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Penutup
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="thanks" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Ucapan Terima Kasih
            </Label>
            <Textarea
              id="thanks"
              value={footer.thank_you_message ?? ""}
              onChange={(e) =>
                setFooter((f) => ({
                  ...f,
                  thank_you_message: e.target.value.trim() || null,
                }))
              }
              rows={3}
              className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
              Kredit Pembuat (opsional)
            </Label>
            <Input
              id="credit"
              value={footer.made_by_credit ?? ""}
              onChange={(e) =>
                setFooter((f) => ({
                  ...f,
                  made_by_credit: e.target.value.trim() || null,
                }))
              }
              placeholder="Dibuat dengan cinta oleh ..."
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
