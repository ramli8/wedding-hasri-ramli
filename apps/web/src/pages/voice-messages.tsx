import { useMutation, useQuery } from "@tanstack/react-query";
import type { VoiceMessage } from "@wedding/shared";
import { Download, Eye, EyeOff, Mic, Trash2 } from "lucide-react";
import { useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button, buttonVariants } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi, downloads } from "../lib/admin-api.js";
import { formatDateTime } from "../lib/datetime.js";
import { useRefresh, voiceQuery } from "../lib/queries.js";

type Visibility = "semua" | "shown" | "hidden";

const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Pesan suara tamu dari halaman undangan: diputar di sini, disembunyikan, diunduh sebagai ZIP. */
export function VoiceMessages() {
  const list = useQuery(voiceQuery);
  const [visibility, setVisibility] = useState<Visibility>("semua");
  const [deleting, setDeleting] = useState<VoiceMessage | null>(null);
  const all = list.data?.items ?? [];
  const items = all.filter((item) =>
    visibility === "semua" ? true : visibility === "hidden" ? item.hidden : !item.hidden,
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{all.length} pesan suara</p>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={visibility} onValueChange={(value) => setVisibility(value as Visibility)}>
            <TabsList>
              <TabsTrigger value="semua">Semua</TabsTrigger>
              <TabsTrigger value="shown">Tampil</TabsTrigger>
              <TabsTrigger value="hidden">Disembunyikan</TabsTrigger>
            </TabsList>
          </Tabs>
          {all.some((item) => !item.hidden) && (
            <a href={downloads.voiceZip} className={buttonVariants({ variant: "outline" })}>
              <Download aria-hidden />
              Unduh ZIP
            </a>
          )}
        </div>
      </div>

      {list.isError && <Alert tone="error">{list.error.message}</Alert>}

      {list.data && items.length === 0 ? (
        <Card className="items-center px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <Mic className="size-6" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-semibold">Belum ada pesan suara</p>
            <p className="text-sm text-muted-foreground">
              Tamu bisa merekam pesan suara di bagian ucapan halaman undangan.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <VoiceCard item={item} onDelete={() => setDeleting(item)} />
            </li>
          ))}
        </ul>
      )}

      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function VoiceCard({ item, onDelete }: { item: VoiceMessage; onDelete: () => void }) {
  const refresh = useRefresh();
  const toggleHidden = useMutation({
    mutationFn: () => adminApi.voice.hide(item.id, !item.hidden),
    onSuccess: () => refresh("voice"),
  });
  return (
    <Card className={`gap-3 p-4 ${item.hidden ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
          <Mic className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {item.guestName}
            {item.hidden && <Badge variant="secondary">Disembunyikan</Badge>}
          </p>
          <p className="text-xs text-muted-foreground">
            {[item.groupName, formatDateTime(item.createdAt), duration(item.durationMs)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <DataTableRowActions
          actions={[
            {
              label: item.hidden ? "Tampilkan" : "Sembunyikan",
              icon: item.hidden ? <Eye /> : <EyeOff />,
              onSelect: () => toggleHidden.mutate(),
            },
            "separator",
            { label: "Hapus", icon: <Trash2 />, destructive: true, onSelect: onDelete },
          ]}
        />
      </div>
      {/* biome-ignore lint/a11y/useMediaCaption: rekaman suara tamu, tanpa teks */}
      <audio controls preload="none" src={downloads.voiceAudio(item.id)} className="w-full" />
      {toggleHidden.error && <Alert tone="error">{toggleHidden.error.message}</Alert>}
    </Card>
  );
}

function DeleteDialog({ item, onClose }: { item: VoiceMessage | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.voice.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("voice");
      onClose();
    },
  });
  return (
    <Dialog open={item !== null} onClose={onClose} title="Hapus pesan suara?">
      {item && (
        <>
          <p>Pesan suara dari {item.guestName} dihapus permanen.</p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(item.id)}
            >
              Hapus
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
