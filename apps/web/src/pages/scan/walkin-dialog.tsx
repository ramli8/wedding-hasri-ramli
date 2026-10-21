import { useLiveQuery } from "dexie-react-hooks";
import { type FormEvent, useState } from "react";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Dialog } from "../../components/ui/dialog.js";
import { Field } from "../../components/ui/field.js";
import { Input } from "../../components/ui/input.js";
import { Select } from "../../components/ui/select.js";
import { addWalkin, type Outcome } from "../../lib/scan/actions.js";
import { db } from "../../lib/scan/db.js";

/** Tamu yang tidak ada di daftar. Dibuat di perangkat dan langsung dicatat masuk. */
export function WalkinDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (outcome: Outcome) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tamu baru"
      description="Tamu yang tidak ada di daftar undangan. Langsung dicatat masuk."
    >
      {open && <WalkinForm onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function WalkinForm({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (outcome: Outcome) => void;
}) {
  const groups = useLiveQuery(() => db.groups.toArray(), [], []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [groupId, setGroupId] = useState("");
  const [pax, setPax] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const outcome = await addWalkin({
        displayName: name,
        phone,
        groupId: groupId || null,
        pax: Math.max(1, Number(pax) || 1),
      });
      onClose();
      onDone(outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah tamu");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Nama">
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
      <Field label="Nomor HP (opsional)">
        {(id) => (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kelompok">
          {(id) => (
            <Select id={id} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Tanpa kelompok</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Jumlah orang">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={500}
              value={pax}
              onChange={(e) => setPax(e.target.value)}
            />
          )}
        </Field>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={busy || !name.trim()}>
          Catat masuk
        </Button>
      </div>
    </form>
  );
}
