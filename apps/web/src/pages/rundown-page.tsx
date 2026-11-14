import { useMutation, useQuery } from "@tanstack/react-query";
import { type RundownItem, shiftTime } from "@wedding/shared";
import {
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  MoveVertical,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import {
  eventsQuery,
  rundownQuery,
  settingsQuery,
  useRefresh,
  vendorsQuery,
} from "../lib/queries.js";

type Editing = { kind: "new" } | { kind: "edit"; item: RundownItem };

const endTime = (item: RundownItem) =>
  item.durationMin ? shiftTime(item.time, item.durationMin) : null;

/**
 * Rundown hari-H per acara. MC dan panitia membuka tautan baca-saja; kalau acara molor, geser jam
 * satu kegiatan beserta semua sesudahnya sekaligus.
 */
export function RundownPage() {
  const refresh = useRefresh();
  const events = useQuery(eventsQuery);
  const rundown = useQuery(rundownQuery);
  const vendors = useQuery(vendorsQuery);
  const settings = useQuery(settingsQuery);
  const [eventId, setEventId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [shifting, setShifting] = useState<RundownItem | null>(null);
  const [deleting, setDeleting] = useState<RundownItem | null>(null);

  const eventList = events.data ?? [];
  useEffect(() => {
    if (!eventId && eventList[0]) setEventId(eventList[0].id);
  }, [eventId, eventList]);

  const items = (rundown.data?.items ?? []).filter((item) => item.eventId === eventId);
  const vendorList = vendors.data?.vendors ?? [];
  const vendorName = (id: string | null) => vendorList.find((v) => v.id === id)?.name ?? null;

  const base = settings.data?.publicBaseUrl?.replace(/\/+$/, "") || window.location.origin;
  const shareLink = rundown.data ? `${base}/rundown/${rundown.data.token}` : null;

  const resetToken = useMutation({
    mutationFn: () => adminApi.rundown.resetToken(),
    meta: { toast: "Tautan baru dibuat; tautan lama tidak berlaku" },
    onSuccess: () => refresh("rundown"),
  });

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast("Tautan rundown disalin");
    } catch {
      toast("Gagal menyalin; salin manual saja", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Rundown"
        description="Susunan acara per menit. Bagikan tautannya ke MC dan panitia."
        actions={
          <>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!shareLink}>
                  <Link2 aria-hidden />
                  Tautan MC
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => void copyLink()}>
                  <Copy />
                  Salin tautan
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={shareLink ?? "#"} target="_blank" rel="noopener">
                    <ExternalLink />
                    Buka
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => resetToken.mutate()}>
                  <KeyRound />
                  Ganti tautan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setEditing({ kind: "new" })} disabled={!eventId}>
              Tambah kegiatan
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      {(events.isError || rundown.isError) && (
        <Alert tone="error">{(events.error ?? rundown.error)?.message}</Alert>
      )}
      {events.data && eventList.length === 0 && (
        <Alert>Belum ada acara. Tambahkan acara dulu di menu Acara.</Alert>
      )}

      {eventList.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Acara">
          {eventList.map((event) => (
            <Button
              key={event.id}
              role="tab"
              aria-selected={event.id === eventId}
              variant={event.id === eventId ? "default" : "outline"}
              onClick={() => setEventId(event.id)}
            >
              {event.name}
            </Button>
          ))}
        </div>
      )}

      {eventId && (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-4">
            {items.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                {rundown.isPending ? "Memuat…" : "Belum ada kegiatan. Klik “Tambah kegiatan”."}
              </p>
            ) : (
              <ol className="divide-y">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-2 py-3 sm:gap-5">
                    <div className="w-16 shrink-0 tabular-nums sm:w-20">
                      <p className="text-lg font-bold">{item.time}</p>
                      {endTime(item) && (
                        <p className="text-xs text-muted-foreground">s.d. {endTime(item)}</p>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {[
                          item.pic && `PJ: ${item.pic}`,
                          vendorName(item.vendorId) && `Vendor: ${vendorName(item.vendorId)}`,
                          item.durationMin && `${item.durationMin} menit`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.note && <p className="mt-0.5 text-sm">{item.note}</p>}
                    </div>
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Ubah",
                          icon: <SquarePen />,
                          onSelect: () => setEditing({ kind: "edit", item }),
                        },
                        {
                          label: "Geser jam mulai dari sini",
                          icon: <MoveVertical />,
                          onSelect: () => setShifting(item),
                        },
                        "separator",
                        {
                          label: "Hapus",
                          icon: <Trash2 />,
                          destructive: true,
                          onSelect: () => setDeleting(item),
                        },
                      ]}
                    />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.kind === "edit" ? "Ubah kegiatan" : "Tambah kegiatan"}
      >
        {editing && eventId && (
          <ItemForm
            item={editing.kind === "edit" ? editing.item : null}
            eventId={eventId}
            vendors={vendorList.map((v) => ({ id: v.id, name: v.name, selected: v.isSelected }))}
            lastTime={items.at(-1) ? endTime(items.at(-1) as RundownItem) : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <ShiftDialog item={shifting} onClose={() => setShifting(null)} />
      <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function ItemForm({
  item,
  eventId,
  vendors,
  lastTime,
  onDone,
}: {
  item: RundownItem | null;
  eventId: string;
  vendors: { id: string; name: string; selected: boolean }[];
  /** Jam selesai kegiatan terakhir: usulan jam untuk kegiatan baru. */
  lastTime: string | null;
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [time, setTime] = useState(item?.time ?? lastTime ?? "");
  const [duration, setDuration] = useState(item?.durationMin ? String(item.durationMin) : "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [pic, setPic] = useState(item?.pic ?? "");
  const [vendorId, setVendorId] = useState(item?.vendorId ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? null : "Jam wajib diisi",
    title: title.trim() ? null : "Kegiatan wajib diisi",
  };

  const save = useMutation({
    mutationFn: () => {
      const input = {
        eventId: item?.eventId ?? eventId,
        time,
        durationMin: duration ? Number(duration) : null,
        title,
        pic,
        vendorId: vendorId || null,
        note,
      };
      return item ? adminApi.rundown.update(item.id, input) : adminApi.rundown.create(input);
    },
    onSuccess: async () => {
      await refresh("rundown");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.time || errors.title) return;
    save.mutate();
  }

  const inputClass = "h-11 text-base md:h-9 md:text-sm";
  // Vendor yang sudah dipesan lebih dulu.
  const sorted = [...vendors].sort((a, b) => Number(b.selected) - Number(a.selected));
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Jam mulai" required error={submitted ? errors.time : null}>
          {(id) => (
            <Input
              id={id}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Durasi (menit)">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <Field label="Kegiatan" required error={submitted ? errors.title : null}>
        {(id) => (
          <Input
            id={id}
            autoFocus={!item}
            maxLength={160}
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penanggung jawab">
          {(id) => (
            <Input
              id={id}
              maxLength={60}
              autoComplete="off"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Vendor">
          {(id) => (
            <Select id={id} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">Tidak ada</option>
              {sorted.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Catatan">
        {(id) => (
          <Input
            id={id}
            maxLength={500}
            autoComplete="off"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

const SHIFT_OPTIONS = [-15, -5, 5, 10, 15, 30] as const;

function ShiftDialog({ item, onClose }: { item: RundownItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const [minutes, setMinutes] = useState<number>(15);
  const shift = useMutation({
    mutationFn: () => adminApi.rundown.shift(item?.id ?? "", minutes),
    meta: { toast: false },
    onSuccess: async ({ shifted }) => {
      toast(`${shifted} kegiatan digeser ${minutes > 0 ? "+" : ""}${minutes} menit`);
      await refresh("rundown");
      onClose();
    },
  });
  return (
    <Dialog open={item !== null} onClose={onClose} title="Geser jam">
      {item && (
        <>
          <p>
            <strong>{item.title}</strong> ({item.time}) dan semua kegiatan sesudahnya digeser.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SHIFT_OPTIONS.map((value) => (
              <Button
                key={value}
                variant={minutes === value ? "default" : "outline"}
                aria-pressed={minutes === value}
                onClick={() => setMinutes(value)}
                className={cn("h-11 md:h-10 tabular-nums")}
              >
                <Clock aria-hidden />
                {value > 0 ? `+${value}` : value} mnt
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {item.time} → {shiftTime(item.time, minutes)}
          </p>
          {shift.error && <Alert tone="error">{shift.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={() => shift.mutate()} disabled={shift.isPending}>
              Geser
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function DeleteDialog({ item, onClose }: { item: RundownItem | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.rundown.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("rundown");
      onClose();
    },
  });
  return (
    <Dialog open={item !== null} onClose={onClose} title="Hapus kegiatan?">
      {item && (
        <>
          <p>
            <strong>{item.title}</strong> ({item.time}) dihapus dari rundown.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
            >
              Hapus
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
