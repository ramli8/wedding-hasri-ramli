import { useMutation, useQuery } from "@tanstack/react-query";
import type { Device } from "@wedding/shared";
import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Dialog } from "../components/ui/dialog.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { adminApi } from "../lib/admin-api.js";
import { devicesQuery, useRefresh } from "../lib/queries.js";
import { formatAgo } from "../lib/scan/format.js";

const STATUS = {
  pending: { label: "Belum dipasang", variant: "pill" },
  active: { label: "Aktif", variant: "pillAcid" },
  revoked: { label: "Dicabut", variant: "pill" },
} as const;

export function DevicesPage() {
  const devices = useQuery(devicesQuery);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState<{ name: string; code: string; expires: string | null } | null>(
    null,
  );
  const [revoking, setRevoking] = useState<Device | null>(null);

  return (
    <>
      <PageHeader
        tag="Perangkat"
        title="Perangkat penjaga"
        description="HP atau laptop yang dipakai di pintu. Tiap perangkat dipasangkan dengan kode sekali pakai dan bisa dicabut kapan saja."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            Tambah perangkat
          </Button>
        }
      />

      {devices.isPending ? (
        <p className="text-ink-soft">Memuat…</p>
      ) : devices.isError ? (
        <Alert tone="error">{devices.error.message}</Alert>
      ) : devices.data.length === 0 ? (
        <Card>
          <p className="text-ink-soft">
            Belum ada perangkat. Tambahkan satu per HP atau laptop yang akan dipakai di pintu.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto border-2 border-ink bg-paper shadow-hard">
          <table className="w-full text-left text-sm">
            <thead className="tag border-b-2 border-ink text-ink-soft">
              <tr>
                <th className="px-4 py-3">Perangkat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Terakhir sinkron</th>
                <th className="px-4 py-3">Antrean</th>
                <th className="px-4 py-3">Versi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-2">
              {devices.data.map((device) => (
                <tr key={device.id}>
                  <td className="px-4 py-3 font-semibold">{device.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS[device.status].variant}>
                      {STATUS[device.status].label}
                    </Badge>
                    {device.pairingExpiresAt && (
                      <p className="mt-1 text-xs text-ink-soft">
                        kode berlaku sampai{" "}
                        {new Date(device.pairingExpiresAt).toLocaleString("id-ID")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {device.lastSyncAt ? formatAgo(Date.parse(device.lastSyncAt)) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {device.status === "active" ? device.pendingOutbox : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{device.appVersion ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {device.status !== "revoked" && (
                        <Button size="sm" variant="destructive" onClick={() => setRevoking(device)}>
                          Cabut
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          <Button variant="secondary" onClick={onClose}>
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
            className="border-2 border-ink bg-acid py-4 text-center font-mono text-4xl font-bold tracking-label"
            data-testid="pairing-code"
          >
            {code.code}
          </p>
          <Alert>
            Kode ini hanya tampil sekarang, berlaku 24 jam, dan hangus setelah dipakai. Kalau
            hilang, cabut perangkat ini lalu buat yang baru.
          </Alert>
          <div className="flex justify-end">
            <Button onClick={onClose}>Selesai</Button>
          </div>
        </div>
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
            <Button variant="secondary" onClick={onClose}>
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
