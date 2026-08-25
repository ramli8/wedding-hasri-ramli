"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Edit,
  ExternalLink,
  Inbox,
  Loader2,
  MapPin,
  Plus,
  Star,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/src/presentation/components/ui/badge";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Switch } from "@/src/presentation/components/ui/switch";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/presentation/components/ui/alert-dialog";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useUpdateWedding,
} from "@/src/application/hooks/use-wedding-query";
import type {
  EventResponse,
  WeddingResponse,
} from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "./wedding-save";
import { TabLoading } from "./tab-loading";
import { DateTimeField } from "./date-time-field";

interface EventFormState {
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  addressFull: string;
  gmapsUrl: string;
  notes: string;
  isMainEvent: boolean;
  orderIndex: number;
}

const EMPTY_FORM: EventFormState = {
  name: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venueName: "",
  addressFull: "",
  gmapsUrl: "",
  notes: "",
  isMainEvent: false,
  orderIndex: 0,
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  // Baca lewat getter lokal agar tidak bergeser oleh zona UTC.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateTime(date: string, time?: string): string | null {
  if (!date) return null;
  const d = new Date(time ? `${date}T${time}` : date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "Belum diatur";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return Number.isNaN(d.getTime())
    ? null
    : `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

function InfoBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/30 bg-muted/30 p-3">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

export function EventsTab({ data }: { data?: WeddingResponse }) {
  const eventsQuery = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const updateWedding = useUpdateWedding();

  const [weddingDate, setWeddingDate] = useState(() =>
    toDateInput(data?.wedding_date ?? null)
  );
  useEffect(() => {
    setWeddingDate(toDateInput(data?.wedding_date ?? null));
  }, [data?.wedding_date]);

  // Auto-save: tanggal pernikahan dipakai di cover & fallback countdown.
  const handleWeddingDateChange = (value: string) => {
    setWeddingDate(value);
    updateWedding.mutate(
      buildSaveRequest(data, {
        wedding_date: value
          ? new Date(`${value}T00:00:00`).toISOString()
          : null,
      }),
      {
        onSuccess: () => toast.success("Tanggal pernikahan tersimpan"),
        onError: () => toast.error("Gagal menyimpan tanggal pernikahan"),
      }
    );
  };

  const { data: eventData, isLoading } = eventsQuery;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<EventResponse | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [hasTime, setHasTime] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, orderIndex: events.length });
    setHasTime(false);
    setSheetOpen(true);
  };

  const handleHasTimeChange = (checked: boolean) => {
    setHasTime(checked);
    if (!checked) {
      // Matikan → jam dikosongkan agar tidak tersimpan sebagian.
      setForm((f) => ({ ...f, startTime: "", endTime: "" }));
    }
  };

  // Pola reorder sama dengan halaman Section: tukar order_index dgn tetangga.
  const handleMove = async (event: EventResponse, dir: -1 | 1) => {
    const idx = events.findIndex((e) => e.id === event.id);
    const neighbor = events[idx + dir];
    if (!neighbor) return;
    setMovingId(event.id);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        req: { order_index: neighbor.order_index },
      });
      await updateEvent.mutateAsync({
        id: neighbor.id,
        req: { order_index: event.order_index },
      });
    } catch {
      toast.error("Gagal mengubah urutan");
    } finally {
      setMovingId(null);
    }
  };

  const openEdit = (event: EventResponse) => {
    setEditingId(event.id);
    setHasTime(Boolean(event.start_time || event.end_time));
    setForm({
      name: event.name,
      eventDate: toDateInput(event.event_date),
      startTime: toTimeInput(event.start_time),
      endTime: toTimeInput(event.end_time),
      venueName: event.venue_name ?? "",
      addressFull: event.address_full ?? "",
      gmapsUrl: event.gmaps_url ?? "",
      notes: event.notes ?? "",
      isMainEvent: event.is_main_event,
      orderIndex: event.order_index,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Nama acara wajib diisi");
      return;
    }
    const payload = {
      name: form.name.trim(),
      event_date: combineDateTime(form.eventDate),
      start_time: hasTime
        ? combineDateTime(form.eventDate, form.startTime)
        : null,
      end_time: hasTime
        ? combineDateTime(form.eventDate, form.endTime)
        : null,
      venue_name: form.venueName.trim() || null,
      address_full: form.addressFull.trim() || null,
      gmaps_url: form.gmapsUrl.trim() || null,
      notes: form.notes.trim() || null,
      is_main_event: form.isMainEvent,
      order_index: Number.isNaN(form.orderIndex) ? 0 : form.orderIndex,
    };

    if (editingId) {
      updateEvent.mutate(
        { id: editingId, req: payload },
        {
          onSuccess: () => {
            toast.success("Acara tersimpan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menyimpan acara"),
        }
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          toast.success("Acara ditambahkan");
          setSheetOpen(false);
        },
        onError: () => toast.error("Gagal menambah acara"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteEvent.mutate(deleteTarget.id, {
      onSuccess: () => toast.success("Acara dihapus"),
      onError: () => toast.error("Gagal menghapus acara"),
      onSettled: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <TabLoading />;

  const events = [...(eventData ?? [])].sort(
    (a, b) =>
      a.order_index - b.order_index ||
      new Date(a.start_time ?? a.event_date ?? 0).getTime() -
        new Date(b.start_time ?? b.event_date ?? 0).getTime()
  );
  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <div className="pb-24">
      {/* Tanggal pernikahan — fallback cover/countdown bila tidak ada acara utama */}
      <Card className="mb-6 rounded-2xl border-border/60 shadow-sm">
        <CardContent className="space-y-1.5 p-4">
          <Label htmlFor="wedding-date" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tanggal Pernikahan
          </Label>
          <Input
            id="wedding-date"
            type="date"
            value={weddingDate}
            onChange={(e) => handleWeddingDateChange(e.target.value)}
            disabled={updateWedding.isPending}
            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] shadow-none focus-visible:ring-primary disabled:opacity-60"
          />
          <p className="pl-1 text-[10.5px] leading-relaxed text-muted-foreground">
            Dipakai di cover &amp; countdown bila tidak ada acara utama. Tersimpan otomatis.
          </p>
        </CardContent>
      </Card>

      {/* Count row — senada dengan "N Tamu" di menu Guests */}
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {events.length} Acara
        </span>
        <span className="text-[11px] text-muted-foreground">
          Urutkan lewat field Urutan
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox className="h-16 w-16 opacity-20" />
          <p className="text-[13px] text-muted-foreground">
            Belum ada acara. Tambahkan akad atau resepsi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, idx) => {
            const time = formatTime(event.start_time);
            return (
              <Card key={event.id} className="rounded-2xl border-border/60 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words text-[14px] font-bold leading-snug">
                      {event.name}
                    </p>
                    {event.is_main_event ? (
                      <Badge className="shrink-0 gap-1 rounded-full bg-amber-500/15 text-[10px] font-semibold uppercase tracking-wider text-amber-600 hover:bg-amber-500/15 dark:text-amber-400">
                        <Star className="h-3 w-3 fill-current" /> Utama
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InfoBox label="Tanggal & Waktu">
                      <p className="text-[12px] font-semibold leading-snug text-foreground">
                        {formatDate(event.event_date)}
                      </p>
                      {time ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          Pukul {time}
                          {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
                        </p>
                      ) : event.end_time ? null : (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Jam mengikuti kategori tamu
                        </p>
                      )}
                    </InfoBox>
                    <InfoBox label="Venue">
                      {event.venue_name ? (
                        <p className="truncate text-[12px] font-semibold leading-snug text-foreground">
                          {event.venue_name}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Belum diatur</p>
                      )}
                    </InfoBox>
                  </div>

                  {event.address_full || event.gmaps_url ? (
                    <div className="space-y-1 pl-0.5">
                      {event.address_full ? (
                        <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {event.address_full}
                        </p>
                      ) : null}
                      {event.gmaps_url ? (
                        <a
                          href={event.gmaps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition-colors hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Buka Google Maps
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  {event.notes ? (
                    <p className="flex items-start gap-1.5 rounded-xl bg-muted/20 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {event.notes}
                    </p>
                  ) : null}

                  <div className="mt-1 grid grid-cols-4 divide-x divide-border/40 border-t border-border/40 pt-3">
                    <button
                      onClick={() => void handleMove(event, -1)}
                      disabled={idx === 0 || movingId !== null}
                      aria-label={`Naikkan ${event.name}`}
                      className="flex cursor-pointer items-center justify-center gap-1 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted/30 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ArrowUp className="h-3.5 w-3.5" /> Naik
                    </button>
                    <button
                      onClick={() => void handleMove(event, 1)}
                      disabled={idx === events.length - 1 || movingId !== null}
                      aria-label={`Turunkan ${event.name}`}
                      className="flex cursor-pointer items-center justify-center gap-1 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted/30 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ArrowDown className="h-3.5 w-3.5" /> Turun
                    </button>
                    <button
                      onClick={() => openEdit(event)}
                      aria-label={`Edit ${event.name}`}
                      className="flex cursor-pointer items-center justify-center gap-1 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted/30"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      aria-label={`Hapus ${event.name}`}
                      className="flex cursor-pointer items-center justify-center gap-1 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-destructive active:bg-muted/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label="Tambah acara"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom sheet create/edit */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                {editingId ? "Edit Acara" : "Tambah Acara"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Tutup"
                className="absolute right-0 cursor-pointer p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              <div className="space-y-1.5">
                <Label htmlFor="event-name" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Acara</Label>
                <Input
                  id="event-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Akad Nikah / Resepsi"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-date" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Tanggal Acara</Label>
                <DateTimeField
                  id="event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(v) => setForm((f) => ({ ...f, eventDate: v }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-[13px] font-semibold leading-tight">Atur Jam Acara</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Kosongkan bila jam mengikuti kategori tamu
                  </p>
                </div>
                <Switch
                  checked={hasTime}
                  onCheckedChange={handleHasTimeChange}
                  aria-label="Atur jam acara"
                />
              </div>
              {hasTime ? (
                <div className="grid grid-cols-2 gap-3">
                  <DateTimeField
                    id="event-start"
                    type="time"
                    label="Jam Mulai"
                    value={form.startTime}
                    onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                  />
                  <DateTimeField
                    id="event-end"
                    type="time"
                    label="Jam Selesai"
                    value={form.endTime}
                    onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="event-venue" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Venue</Label>
                <Input
                  id="event-venue"
                  value={form.venueName}
                  onChange={(e) => setForm((f) => ({ ...f, venueName: e.target.value }))}
                  placeholder="Balai Kartini"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-address" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Alamat Lengkap</Label>
                <Textarea
                  id="event-address"
                  value={form.addressFull}
                  onChange={(e) => setForm((f) => ({ ...f, addressFull: e.target.value }))}
                  rows={2}
                  className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-gmaps" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Link Google Maps</Label>
                <Input
                  id="event-gmaps"
                  value={form.gmapsUrl}
                  onChange={(e) => setForm((f) => ({ ...f, gmapsUrl: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/..."
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-notes" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Catatan</Label>
                <Input
                  id="event-notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Dress code: earth tone"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-[13px] font-semibold">Acara Utama</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Target countdown &amp; Simpan Tanggal
                  </p>
                </div>
                <Switch
                  checked={form.isMainEvent}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isMainEvent: checked }))}
                  aria-label="Jadikan acara utama"
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

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[340px] rounded-[2rem] p-6">
          <AlertDialogHeader className="items-center space-y-2 text-center sm:text-center">
            <AlertDialogTitle className="text-base">Hapus acara?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Acara &quot;{deleteTarget?.name}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteEvent.isPending}
              className="w-full bg-destructive text-white hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Hapus
            </AlertDialogAction>
            <AlertDialogCancel className="w-full active:scale-95 transition-all">Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
