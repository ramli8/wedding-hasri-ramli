import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { Device } from "@wedding/shared";
import { Ban, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableColumnHeader } from "@/components/data-table/column-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { selectColumn } from "@/components/data-table/select-column";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminApi } from "../lib/admin-api.js";
import { devicesQuery, useRefresh } from "../lib/queries.js";
import { formatAgo } from "../lib/scan/format.js";

const STATUS = {
  pending: { label: "Belum dipasang", variant: "outline" },
  active: { label: "Aktif", variant: "secondary" },
  revoked: { label: "Dicabut", variant: "outline" },
} as const;

export function DevicesPage() {
  const devices = useQuery(devicesQuery);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState<{ name: string; code: string; expires: string | null } | null>(
    null,
  );
  const [revoking, setRevoking] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState<Device | null>(null);

  const columns: ColumnDef<Device, unknown>[] = [
    selectColumn<Device>(),
    {
      id: "nama",
      accessorFn: (device) => device.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Perangkat" />,
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
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
            {device.pairingExpiresAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                kode berlaku sampai {new Date(device.pairingExpiresAt).toLocaleString("id-ID")}
              </p>
            )}
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
        title="Perangkat penjaga"
        description="HP atau laptop yang dipakai di pintu. Tiap perangkat dipasangkan dengan kode sekali pakai dan bisa dicabut kapan saja."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            Tambah perangkat
          </Button>
        }
      />

      {devices.isError && <Alert tone="error">{devices.error.message}</Alert>}
      <DataTable
        columns={columns}
        data={devices.data ?? []}
        getRowId={(device) => device.id}
        searchPlaceholder="Cari perangkat"
        searchKey="nama"
        emptyText={
          devices.isPending
            ? "Memuat…"
            : "Belum ada perangkat. Tambahkan satu per HP atau laptop yang akan dipakai di pintu."
        }
        filters={[
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
      <CodeDialog code={code} onClose={() => setCode(null)} />
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
  onCreated: (result: { name: string; code: string; expires: string | null }) => void;
}) {
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => adminApi.devices.create(name),
    onSuccess: async (data) => {
      await refresh("devices");
      onCreated({
        name: data.device.name,
        code: data.pairingCode,
        expires: data.device.pairingExpiresAt,
      });
      setName("");
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Tambah perangkat">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          label="Nama perangkat"
          hint="Agar mudah dikenali di dashboard, mis. “HP Gerbang A” atau “Laptop Meja Bantuan”."
        >
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending || !name.trim()}>
            Buat kode pairing
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function CodeDialog({
  code,
  onClose,
}: {
  code: { name: string; code: string; expires: string | null } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={code !== null} onClose={onClose} title={`Pasangkan ${code?.name ?? ""}`}>
      {code && (
        <div className="flex flex-col gap-4">
          <p>
            Di perangkat itu, buka <b className="font-mono">{window.location.origin}/scan/pasang</b>{" "}
            dan masukkan kode ini. Lakukan saat internet masih menyala.
          </p>
          <p
            className="border bg-accent py-4 text-center font-mono text-4xl font-bold"
            data-testid="pairing-code"
          >
            {code.code}
          </p>
          <Alert>
            Kode ini hanya tampil sekarang, berlaku 24 jam, dan hangus setelah dipakai. Kalau
            hilang, cabut perangkat ini lalu buat yang baru.
          </Alert>
          <div className="flex justify-end max-md:justify-start">
            <Button onClick={onClose}>Selesai</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function DeleteDialog({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.devices.remove(id),
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
          <div className="flex justify-end gap-2">
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
          </div>
        </>
      )}
    </Dialog>
  );
}

function RevokeDialog({ device, onClose }: { device: Device | null; onClose: () => void }) {
  const refresh = useRefresh();
  const revoke = useMutation({
    mutationFn: (id: string) => adminApi.devices.revoke(id),
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
          <div className="flex justify-end gap-2">
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
          </div>
        </>
      )}
    </Dialog>
  );
}
