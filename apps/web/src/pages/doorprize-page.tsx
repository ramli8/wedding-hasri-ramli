import { useMutation, useQuery } from "@tanstack/react-query";
import type { Doorprize, DoorprizeDrawResponse, DoorprizeWinner } from "@wedding/shared";
import {
  Gift,
  Loader2,
  PartyPopper,
  Plus,
  RotateCcw,
  SquarePen,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import { doorprizeQuery, useRefresh } from "../lib/queries.js";
import { formatClock } from "../lib/scan/format.js";

type Editing = { kind: "new" } | { kind: "edit"; prize: Doorprize };
/** Undian yang sedang tampil di layar: undian baru untuk hadiah, atau undi ulang satu pemenang. */
type Drawing = { prize: Doorprize; redrawOf?: DoorprizeWinner; round: number };

const activeWinners = (prize: Doorprize) => prize.winners.filter((w) => !w.forfeitedAt);

/**
 * Doorprize dari laptop admin ke proyektor. Peserta: tamu yang sudah check-in dan belum pernah diundi.
 * Pemenang yang tidak maju bisa diundi ulang (namanya dicoret).
 */
export function DoorprizePage() {
  const list = useQuery(doorprizeQuery);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Doorprize | null>(null);
  const [cancelling, setCancelling] = useState<DoorprizeWinner | null>(null);
  const [drawing, setDrawing] = useState<Drawing | null>(null);

  const data = list.data;
  const prizes = data?.prizes ?? [];

  return (
    <>
      <PageHeader
        title="Doorprize"
        description="Undian untuk tamu yang sudah check-in. Satu tamu hanya bisa menang sekali."
        actions={
          <Button onClick={() => setEditing({ kind: "new" })}>
            Tambah hadiah
            <Plus aria-hidden />
          </Button>
        }
      />
      {list.isError && <Alert tone="error">{list.error.message}</Alert>}
      {data && (
        <p className="text-muted-foreground">
          <b className="text-foreground tabular-nums">{data.poolSize}</b> tamu ikut undian
        </p>
      )}
      {data && prizes.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground">
            Belum ada hadiah. Klik “Tambah hadiah”.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {prizes.map((prize) => {
          const active = activeWinners(prize);
          const full = active.length >= prize.quantity;
          return (
            <Card key={prize.id} className="gap-3 py-4">
              <CardContent className="flex flex-col gap-3 px-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                    <Gift className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words">{prize.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {active.length} dari {prize.quantity} pemenang
                    </p>
                  </div>
                  <Button
                    onClick={() => setDrawing({ prize, round: 0 })}
                    disabled={full || !data || data.poolSize === 0}
                  >
                    <PartyPopper aria-hidden />
                    Undi
                  </Button>
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Ubah",
                        icon: <SquarePen />,
                        onSelect: () => setEditing({ kind: "edit", prize }),
                      },
                      "separator",
                      {
                        label: "Hapus",
                        icon: <Trash2 />,
                        destructive: true,
                        onSelect: () => setDeleting(prize),
                      },
                    ]}
                  />
                </div>
                {prize.winners.length > 0 && (
                  <ol className="flex flex-col divide-y rounded-lg border">
                    {prize.winners.map((winner) => (
                      <li key={winner.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-medium break-words",
                              winner.forfeitedAt && "text-muted-foreground line-through",
                            )}
                          >
                            {winner.guestName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[winner.groupName, formatClock(winner.drawnAt)]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        {winner.forfeitedAt ? (
                          <Badge variant="outline">Tidak maju</Badge>
                        ) : (
                          <DataTableRowActions
                            actions={[
                              {
                                label: "Undi ulang (tidak maju)",
                                icon: <RotateCcw />,
                                onSelect: () => setDrawing({ prize, redrawOf: winner, round: 0 }),
                              },
                              "separator",
                              {
                                label: "Batalkan hasil",
                                icon: <Undo2 />,
                                destructive: true,
                                onSelect: () => setCancelling(winner),
                              },
                            ]}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.kind === "edit" ? "Ubah hadiah" : "Tambah hadiah"}
      >
        {editing && (
          <PrizeForm
            prize={editing.kind === "edit" ? editing.prize : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>
      <DeletePrizeDialog prize={deleting} onClose={() => setDeleting(null)} />
      <CancelWinnerDialog winner={cancelling} onClose={() => setCancelling(null)} />
      {drawing && data && (
        <DrawStage
          drawing={drawing}
          names={data.poolSample}
          onClose={() => setDrawing(null)}
          onNext={(next) => setDrawing(next)}
        />
      )}
    </>
  );
}

/** Lama nama berputar sebelum pemenang tampil. */
const ROLL_MS = 3_000;

/**
 * Panggung undian layar penuh untuk proyektor: nama peserta berputar, lalu pemenang dari server
 * tampil besar. Putaran hanya hiasan; pemenang dipilih acak di server.
 */
function DrawStage({
  drawing,
  names,
  onClose,
  onNext,
}: {
  drawing: Drawing;
  names: string[];
  onClose: () => void;
  onNext: (next: Drawing) => void;
}) {
  // Wadah layar penuh tetap terpasang selama undian beruntun; tiap putaran dipasang ulang di dalamnya
  // (bila wadahnya ikut dilepas, peramban keluar dari layar penuh).
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!document.fullscreenElement) void stage.current?.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  return (
    <div
      ref={stage}
      role="dialog"
      aria-modal="true"
      aria-label="Undian doorprize"
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 text-neutral-50"
    >
      <DrawRound
        key={`${drawing.prize.id}-${drawing.redrawOf?.id ?? "baru"}-${drawing.round}`}
        drawing={drawing}
        names={names}
        onClose={onClose}
        onNext={onNext}
      />
    </div>
  );
}

function DrawRound({
  drawing,
  names,
  onClose,
  onNext,
}: {
  drawing: Drawing;
  names: string[];
  onClose: () => void;
  onNext: (next: Drawing) => void;
}) {
  const refresh = useRefresh();
  const [rolling, setRolling] = useState(true);
  const [shown, setShown] = useState(names[0] ?? "…");
  const [result, setResult] = useState<DoorprizeDrawResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startedAt = Date.now();
    const request = drawing.redrawOf
      ? adminApi.doorprize.redraw(drawing.redrawOf.id)
      : adminApi.doorprize.draw(drawing.prize.id);
    request
      .then(async (res) => {
        await new Promise((r) => setTimeout(r, Math.max(0, ROLL_MS - (Date.now() - startedAt))));
        setResult(res);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Gagal mengundi"))
      .finally(() => {
        setRolling(false);
        void refresh("doorprize");
      });
  }, [drawing, refresh]);

  useEffect(() => {
    if (!rolling || names.length === 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % names.length;
      setShown(names[i] ?? "…");
    }, 80);
    return () => clearInterval(timer);
  }, [rolling, names]);

  const close = onClose;

  const prize = result?.prize ?? drawing.prize;
  const remaining = prize.quantity - activeWinners(prize).length;

  return (
    <div className="flex min-h-full flex-col items-center justify-between gap-6 px-6 py-10 text-center">
      <div className="flex w-full items-start justify-between gap-4">
        <span />
        <p className="text-sm font-medium tracking-[0.4em] text-neutral-400 uppercase sm:text-lg">
          Doorprize
        </p>
        <button
          type="button"
          onClick={close}
          aria-label="Tutup"
          className="grid size-12 place-items-center rounded-full bg-white/10 text-neutral-300 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <p className="text-3xl font-semibold text-amber-300 sm:text-5xl">{prize.name}</p>
        {error ? (
          <p className="max-w-xl text-xl text-red-300 sm:text-2xl">{error}</p>
        ) : result ? (
          <div className="flex flex-col items-center gap-3 duration-700 animate-in fade-in zoom-in-90">
            <p className="text-xl text-neutral-400 sm:text-3xl">Selamat kepada</p>
            <h2 className="max-w-[18ch] text-[clamp(3rem,9vw,9rem)] leading-[1.05] font-bold tracking-tight break-words [overflow-wrap:anywhere]">
              {result.winner.guestName}
            </h2>
            {result.winner.groupName && (
              <p className="text-xl text-neutral-300 sm:text-3xl">{result.winner.groupName}</p>
            )}
          </div>
        ) : (
          <p
            aria-live="off"
            className="max-w-[18ch] text-[clamp(2.5rem,7vw,7rem)] leading-[1.05] font-bold tracking-tight break-words text-neutral-500 [overflow-wrap:anywhere]"
          >
            {shown}
          </p>
        )}
      </div>

      <div className="flex min-h-14 flex-wrap justify-center gap-3">
        {rolling ? (
          <p className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="size-5 animate-spin" aria-hidden /> Mengundi…
          </p>
        ) : (
          <>
            {result && (
              <button
                type="button"
                onClick={() => onNext({ prize, redrawOf: result.winner, round: drawing.round + 1 })}
                className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-base font-medium text-neutral-200 hover:text-white"
              >
                <RotateCcw className="size-4" aria-hidden />
                Undi ulang (tidak maju)
              </button>
            )}
            {result && remaining > 0 && (
              <button
                type="button"
                onClick={() => onNext({ prize, round: drawing.round + 1 })}
                className="flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-base font-semibold text-neutral-950"
              >
                <PartyPopper className="size-4" aria-hidden />
                Undi lagi ({remaining} tersisa)
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="flex min-h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-base font-medium text-neutral-200 hover:text-white"
            >
              Selesai
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PrizeForm({ prize, onDone }: { prize: Doorprize | null; onDone: () => void }) {
  const refresh = useRefresh();
  const [name, setName] = useState(prize?.name ?? "");
  const [quantity, setQuantity] = useState(String(prize?.quantity ?? 1));
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? "Nama hadiah wajib diisi" : null;
  const qty = Number(quantity);
  const qtyError = submitted && !(Number.isInteger(qty) && qty >= 1) ? "Minimal 1 pemenang" : null;

  const save = useMutation({
    mutationFn: () => {
      const input = { name, quantity: qty };
      return prize ? adminApi.doorprize.update(prize.id, input) : adminApi.doorprize.create(input);
    },
    onSuccess: async () => {
      await refresh("doorprize");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || !(Number.isInteger(qty) && qty >= 1)) return;
    save.mutate();
  }

  const inputClass = "h-11 text-base md:h-9 md:text-sm";
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nama hadiah" required error={nameError}>
        {(id) => (
          <Input
            id={id}
            autoFocus={!prize}
            maxLength={120}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Jumlah pemenang" required error={qtyError}>
        {(id) => (
          <Input
            id={id}
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

function DeletePrizeDialog({ prize, onClose }: { prize: Doorprize | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.doorprize.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("doorprize");
      onClose();
    },
  });
  return (
    <Dialog open={prize !== null} onClose={onClose} title="Hapus hadiah?">
      {prize && (
        <>
          <p>
            {prize.name} dan hasil undiannya dihapus. Pemenangnya ikut diundi lagi untuk hadiah
            lain.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(prize.id)}
            >
              Hapus
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function CancelWinnerDialog({
  winner,
  onClose,
}: {
  winner: DoorprizeWinner | null;
  onClose: () => void;
}) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.doorprize.removeWinner(id),
    meta: { toast: "Hasil dibatalkan" },
    onSuccess: async () => {
      await refresh("doorprize");
      onClose();
    },
  });
  return (
    <Dialog open={winner !== null} onClose={onClose} title="Batalkan hasil undian?">
      {winner && (
        <>
          <p>
            {winner.guestName} dihapus dari daftar pemenang dan ikut diundi lagi. Untuk pemenang
            yang tidak maju, pakai “Undi ulang”.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Kembali
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(winner.id)}
            >
              Batalkan hasil
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
