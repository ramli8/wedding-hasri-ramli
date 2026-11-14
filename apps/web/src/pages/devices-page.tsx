import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DEVICE_PAIR_PAGE, type Device, type DeviceKind } from "@wedding/shared";
import {
  Ban,
  Camera,
  Copy,
  HandCoins,
  KeyRound,
  Link2,
  Monitor,
  Plus,
  Printer,
  ScanLine,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { type FormEvent, useEffect, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api.js";
import { devicesQuery, useRefresh } from "../lib/queries.js";
import { formatAgo } from "../lib/scan/format.js";
import { type PairingCard, PairingCardsPreview, PrintCardsDialog } from "./devices-print.js";

const STATUS = {
  pending: { label: "Belum dipasang", variant: "outline" },
  active: { label: "Aktif", variant: "secondary" },
  revoked: { label: "Dicabut", variant: "outline" },
} as const;

/** Jenis perangkat: dipilih saat membuat kode, menentukan halaman pasang yang menerima kodenya. */
const KIND: Record<
  DeviceKind,
  { label: string; icon: typeof ScanLine; page: string; hint: string; example: string }
> = {
  scanner: {
    label: "Scanner pintu",
    icon: ScanLine,
    page: DEVICE_PAIR_PAGE.scanner,
    hint: "HP penjaga untuk memindai QR tamu.",
    example: "HP Gerbang A",
  },
  booth: {
    label: "Photobooth",
    icon: Camera,
    page: DEVICE_PAIR_PAGE.booth,
    hint: "Laptop booth foto; tidak bisa membuka data tamu.",
    example: "Laptop Booth",
  },
  buwuh: {
    label: "Meja buwuh",
    icon: HandCoins,
    page: DEVICE_PAIR_PAGE.buwuh,
    hint: "HP meja penerima sumbangan; tidak bisa membuka data tamu.",
    example: "HP Meja Buwuh",
  },
  layar: {
    label: "Layar sapa/dapur",
    icon: Monitor,
    page: DEVICE_PAIR_PAGE.layar,
    hint: "TV atau proyektor: sapaan tamu yang datang, atau hitungan porsi untuk dapur.",
    example: "TV Pelaminan",
  },
};

const KIND_DEVICE: Record<DeviceKind, string> = {
  scanner: "HP penjaga",
  booth: "laptop photobooth",
  buwuh: "HP meja buwuh",
  layar: "layar",
};

type PairingCode = { name: string; kind: DeviceKind; code: string };

export function DevicesPage() {
  const refresh = useRefresh();
  const devices = useQuery(devicesQuery);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState<PairingCode | null>(null);
  const [revoking, setRevoking] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);
  const [printPicking, setPrintPicking] = useState(false);
  const [cards, setCards] = useState<PairingCard[] | null>(null);

  // Kode lama hilang: buat kode baru untuk perangkat yang belum dipasang.
  const renew = useMutation({
    mutationFn: (id: string) => adminApi.devices.newPairingCode(id),
    meta: { toast: "Kode baru dibuat" },
    onSuccess: async (data) => {
      await refresh("devices");
      setCode({
        name: data.device.name,
        kind: data.device.kind,
        code: data.pairingCode,
      });
    },
  });

  const columns: ColumnDef<Device, unknown>[] = [
    {
      id: "nama",
      accessorFn: (device) => device.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      id: "jenis",
      accessorFn: (device) => device.kind,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
      cell: ({ row }) => {
        const kind = KIND[row.original.kind];
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <kind.icon className="size-4" aria-hidden />
            {kind.label}
          </span>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "status",
      accessorFn: (device) => device.status,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const device = row.original;
        return (
          <div>
            <Badge variant={STATUS[device.status].variant}>{STATUS[device.status].label}</Badge>
          </div>
        );
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    },
    {
      id: "sinkron",
      accessorFn: (device) => device.lastSyncAt ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Terakhir sinkron" />,
      cell: ({ row }) =>
        row.original.lastSyncAt ? formatAgo(Date.parse(row.original.lastSyncAt)) : "—",
    },
    {
      id: "antrean",
      accessorFn: (device) => (device.status === "active" ? device.pendingOutbox : -1),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Antrean" />,
      cell: ({ row }) => (row.original.status === "active" ? row.original.pendingOutbox : "—"),
    },
    {
      id: "versi",
      accessorFn: (device) => device.appVersion ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Versi" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.appVersion ?? "—"}</span>
      ),
    },
    {
      id: "aksi",
      cell: ({ row }) => {
        const device = row.original;
        return (
          <DataTableRowActions
            actions={[
              ...(device.status === "pending"
                ? [
                    {
                      label: "Buat kode baru",
                      icon: <KeyRound />,
                      disabled: renew.isPending,
                      onSelect: () => renew.mutate(device.id),
                    },
                    "separator" as const,
                  ]
                : []),
              device.status !== "revoked"
                ? {
                    label: "Cabut",
                    icon: <Ban />,
                    destructive: true,
                    onSelect: () => setRevoking(device),
                  }
                : {
                    label: "Hapus",
                    icon: <Trash2 />,
                    destructive: true,
                    onSelect: () => setDeleting(device),
                  },
            ]}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Perangkat"
        description="HP scanner di pintu, laptop photobooth, HP meja buwuh, dan layar sapa/dapur. Tiap perangkat dipasangkan dengan kode sekali pakai sesuai jenisnya dan bisa dicabut kapan saja."
        actions={
          <>
            <Button variant="outline" onClick={() => setPrintPicking(true)}>
              <Printer aria-hidden />
              Cetak kartu pasang
            </Button>
            <Button onClick={() => setCreating(true)}>
              Tambah perangkat
              <Plus aria-hidden />
            </Button>
          </>
        }
      />

      {devices.isError && <Alert tone="error">{devices.error.message}</Alert>}
      {renew.error && <Alert tone="error">{renew.error.message}</Alert>}
      <DataTable
        columns={columns}
        data={devices.data ?? []}
        getRowId={(device) => device.id}
        searchPlaceholder="Cari perangkat"
        searchKey="nama"
        emptyText={
          devices.isPending
            ? "Memuat…"
            : "Belum ada perangkat. Tambahkan satu per HP scanner, laptop photobooth, HP meja buwuh, atau layar."
        }
        filters={[
          {
            columnId: "jenis",
            title: "Jenis",
            options: [
              { label: KIND.scanner.label, value: "scanner" },
              { label: KIND.booth.label, value: "booth" },
              { label: KIND.buwuh.label, value: "buwuh" },
              { label: KIND.layar.label, value: "layar" },
            ],
          },
          {
            columnId: "status",
            title: "Status",
            options: [
              { label: STATUS.pending.label, value: "pending" },
              { label: STATUS.active.label, value: "active" },
              { label: STATUS.revoked.label, value: "revoked" },
            ],
          },
        ]}
      />

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(result) => {
          setCreating(false);
          setCode(result);
        }}
      />
      <CodeDialog
        code={code}
        onClose={() => setCode(null)}
        onPrint={(card) => {
          setCode(null);
          setCards([card]);
        }}
      />
      <PrintCardsDialog
        open={printPicking}
        devices={devices.data ?? []}
        onClose={() => setPrintPicking(false)}
        onReady={(made) => {
          setPrintPicking(false);
          setCards(made);
        }}
      />
      {cards && <PairingCardsPreview cards={cards} onClose={() => setCards(null)} />}
      <RevokeDialog device={revoking} onClose={() => setRevoking(null)} />
      <DeleteDialog device={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (result: PairingCode) => void;
}) {
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<DeviceKind>("scanner");
  const create = useMutation({
    mutationFn: () => adminApi.devices.create(name, kind),
    onSuccess: async (data) => {
      await refresh("devices");
      onCreated({
        name: data.device.name,
        kind: data.device.kind,
        code: data.pairingCode,
      });
      setName("");
      setKind("scanner");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Tambah perangkat">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm leading-none font-medium">Jenis perangkat</legend>
          <RadioGroup
            value={kind}
            onValueChange={(value) => setKind(value as DeviceKind)}
            className="grid gap-2"
          >
            {(Object.keys(KIND) as DeviceKind[]).map((value) => {
              const item = KIND[value];
              return (
                <Label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-accent/50",
                    kind === value && "border-primary bg-accent/30",
                  )}
                >
                  <RadioGroupItem value={value} className="mt-0.5" />
                  <span className="grid gap-1">
                    <span className="flex items-center gap-1.5 text-sm leading-none font-medium">
                      <item.icon className="size-4" aria-hidden />
                      {item.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.hint}</span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </fieldset>
        <Field label="Nama perangkat" hint={`Agar mudah dikenali, mis. “${KIND[kind].example}”.`}>
          {(id) => (
            <Input
              id={id}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        {create.error && <Alert tone="error">{create.error.message}</Alert>}
        <DialogActions>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending || !name.trim()}>
            Buat kode pairing
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** Tautan yang membuka halaman pasang (sesuai jenis perangkat) dengan kode sudah terisi. */
const pairingUrl = (code: PairingCode) =>
  `${window.location.origin}${KIND[code.kind].page}?kode=${encodeURIComponent(code.code)}`;

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} disalin`);
  } catch {
    toast(`Gagal menyalin ${what.toLowerCase()}; salin manual saja`, "error");
  }
}

function CodeDialog({
  code,
  onClose,
  onPrint,
}: {
  code: PairingCode | null;
  onClose: () => void;
  onPrint: (card: PairingCard) => void;
}) {
  return (
    <Dialog open={code !== null} onClose={onClose} title={`Pasangkan ${code?.name ?? ""}`}>
      {code && <CodeBody code={code} onClose={onClose} onPrint={() => onPrint(code)} />}
    </Dialog>
  );
}

function CodeBody({
  code,
  onClose,
  onPrint,
}: {
  code: PairingCode;
  onClose: () => void;
  onPrint: () => void;
}) {
  const url = pairingUrl(code);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 480, margin: 2, errorCorrectionLevel: "M" })
      .then((data) => !cancelled && setImage(data))
      .catch(() => !cancelled && setImage(null));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-4">
      <p>
        Pindai QR ini dengan kamera perangkat itu, lalu ketuk <b>Pasangkan</b>. Atau buka{" "}
        <b className="font-mono break-all">
          {window.location.origin}
          {KIND[code.kind].page}
        </b>{" "}
        di {KIND_DEVICE[code.kind]} dan ketik kodenya. Lakukan saat internet masih menyala.
      </p>
      <div className="flex justify-center">
        {image ? (
          <img
            src={image}
            alt={`QR tautan pasang dengan kode ${code.code}`}
            className="size-56 max-w-full rounded-md border bg-white"
          />
        ) : (
          <div className="grid size-56 max-w-full place-items-center rounded-md border text-sm text-muted-foreground">
            Membuat QR…
          </div>
        )}
      </div>
      <p
        className="border bg-accent py-4 text-center font-mono text-4xl font-bold"
        data-testid="pairing-code"
      >
        {code.code}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => void copy(code.code, "Kode")}>
          Salin kode
          <Copy aria-hidden />
        </Button>
        <Button variant="outline" onClick={() => void copy(url, "Tautan")}>
          Salin tautan
          <Link2 aria-hidden />
        </Button>
      </div>
      <Alert>
        Kode berlaku tanpa batas waktu sampai dipakai sekali. Kartunya bisa dicetak ulang kapan saja
        lewat “Cetak kartu pasang”.
      </Alert>
      <DialogActions>
        <Button variant="outline" onClick={onPrint}>
          <Printer aria-hidden />
          Cetak kartu
        </Button>
        <Button onClick={onClose}>Selesai</Button>
      </DialogActions>
    </div>
  );
}

function DeleteDialog({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.devices.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("devices");
      onClose();
    },
  });

  return (
    <Dialog open={device !== null} onClose={onClose} title={`Hapus “${device?.name}”?`}>
      {device && (
        <>
          <p>
            Perangkat ini dihapus dari daftar. Check-in yang pernah dicatatnya tetap ada, tetapi
            nama perangkatnya tidak lagi tampil di log dan dashboard. Untuk memakainya lagi, buat
            perangkat baru dan pasangkan ulang.
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(device.id)}
              disabled={remove.isPending}
            >
              Hapus perangkat
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function RevokeDialog({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const refresh = useRefresh();
  const revoke = useMutation({
    mutationFn: (id: string) => adminApi.devices.revoke(id),
    meta: { toast: "Perangkat dicabut" },
    onSuccess: async () => {
      await refresh("devices");
      onClose();
    },
  });

  return (
    <Dialog open={device !== null} onClose={onClose} title={`Cabut “${device?.name}”?`}>
      {device && (
        <>
          <p>
            Perangkat ini langsung ditolak saat berikutnya terhubung ke server. Check-in yang sudah
            tersimpan di server tetap ada. Perangkat yang sedang offline baru tahu dicabut setelah
            online.
          </p>
          {revoke.error && <Alert tone="error">{revoke.error.message}</Alert>}
          <DialogActions>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => revoke.mutate(device.id)}
              disabled={revoke.isPending}
            >
              Cabut perangkat
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
