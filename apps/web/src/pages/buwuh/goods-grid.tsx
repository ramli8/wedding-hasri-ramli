import {
  type BuwuhCatalogItem,
  type BuwuhItem,
  MAX_BUWUH_ITEMS,
  MAX_BUWUH_QUANTITY,
} from "@wedding/shared";
import { Minus, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { BottomSheet } from "./bottom-sheet.js";

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
export const formatQty = (quantity: number) =>
  quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 });

type Editing = { index: number | null; name: string; unit: string; quantity: number };

/**
 * Barang pilihan sebagai baris dengan tombol − jumlah + besar: + menambah 1, − mengurangi 1 dan
 * pada 0 barangnya terhapus. Mengetuk angka membuka lembar untuk jumlah pecahan ("2,5") atau ganti
 * satuan; "Barang lain" untuk barang di luar daftar.
 */
export function GoodsGrid({
  catalog,
  items,
  onChange,
}: {
  catalog: BuwuhCatalogItem[];
  items: BuwuhItem[];
  onChange: (items: BuwuhItem[]) => void;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);

  // Barang di luar daftar yang sudah dipilih juga tampil sebagai baris.
  const extra = items.filter((item) => !catalog.some((c) => sameName(c.name, item.name)));
  const rows: BuwuhCatalogItem[] = [...catalog, ...extra.map(({ name, unit }) => ({ name, unit }))];

  const indexOf = (name: string) => items.findIndex((item) => sameName(item.name, name));

  function step(row: BuwuhCatalogItem, delta: 1 | -1) {
    const index = indexOf(row.name);
    const current = index >= 0 ? items[index] : undefined;
    if (!current) {
      if (delta > 0 && items.length < MAX_BUWUH_ITEMS) {
        onChange([...items, { name: row.name, unit: row.unit, quantity: 1 }]);
      }
      return;
    }
    const quantity = Math.round((current.quantity + delta) * 100) / 100;
    if (quantity <= 0) onChange(items.filter((_, i) => i !== index));
    else if (quantity <= MAX_BUWUH_QUANTITY) {
      onChange(items.map((item, i) => (i === index ? { ...item, quantity } : item)));
    }
  }

  function openEditor(row: BuwuhCatalogItem) {
    const index = indexOf(row.name);
    const current = index >= 0 ? items[index] : undefined;
    setEditing({
      index: index >= 0 ? index : null,
      name: row.name,
      unit: current?.unit ?? row.unit,
      quantity: current?.quantity ?? 1,
    });
  }

  function save(next: Editing) {
    const item = { name: next.name.trim(), unit: next.unit.trim(), quantity: next.quantity };
    if (!item.name || item.quantity <= 0) return;
    const existing = next.index ?? indexOf(item.name);
    if (existing >= 0) onChange(items.map((it, i) => (i === existing ? item : it)));
    else if (items.length < MAX_BUWUH_ITEMS) onChange([...items, item]);
    setEditing(null);
  }

  function remove(index: number | null) {
    if (index !== null) onChange(items.filter((_, i) => i !== index));
    setEditing(null);
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const item = items[indexOf(row.name)];
          return (
            <GoodsRow
              key={row.name.toLowerCase()}
              row={row}
              quantity={item?.quantity ?? 0}
              unit={item?.unit ?? row.unit}
              onAdd={() => step(row, 1)}
              onRemove={() => step(row, -1)}
              onEdit={() => openEditor(row)}
            />
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setEditing({ index: null, name: "", unit: "", quantity: 1 })}
        className="bw-press flex h-14 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[var(--bw-line-strong)] text-sm font-semibold text-[var(--bw-muted)]"
      >
        <Plus className="size-5" aria-hidden />
        Barang lain
      </button>

      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.name || "Barang lain"}
      >
        {editing && (
          <QuantityForm
            key={`${editing.index}-${editing.name}`}
            initial={editing}
            onSave={save}
            onRemove={editing.index !== null ? () => remove(editing.index) : undefined}
          />
        )}
      </BottomSheet>
    </>
  );
}

function GoodsRow({
  row,
  quantity,
  unit,
  onAdd,
  onRemove,
  onEdit,
}: {
  row: BuwuhCatalogItem;
  quantity: number;
  unit: string;
  onAdd: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const selected = quantity > 0;
  return (
    <li
      className={`flex items-center gap-2 rounded-2xl border-2 bg-[var(--bw-surface)] py-2 ps-4 pe-2 ${
        selected ? "border-[var(--bw-accent)]" : "border-transparent"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[17px] leading-tight font-bold">{row.name}</span>
        <span className="text-sm text-[var(--bw-muted)]">{unit}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={!selected}
        aria-label={`Kurangi ${row.name}`}
        className="bw-press grid size-14 shrink-0 place-items-center rounded-xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)] disabled:opacity-30"
      >
        <Minus className="size-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Jumlah ${row.name}: ${formatQty(quantity)} ${unit}. Ketuk untuk ubah`}
        className={`bw-num h-14 w-14 shrink-0 rounded-xl text-2xl font-extrabold ${
          selected ? "" : "text-[var(--bw-line-strong)]"
        }`}
      >
        {formatQty(quantity)}
      </button>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Tambah ${row.name}`}
        className="bw-press grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--bw-accent)] text-[var(--bw-on-accent)]"
      >
        <Plus className="size-6" aria-hidden />
      </button>
    </li>
  );
}

function parseQty(text: string): number | null {
  const normalized = text.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100) / 100;
}

/** Ubah jumlah (boleh pecahan: "2,5") dan satuan satu barang; untuk barang lain juga namanya. */
function QuantityForm({
  initial,
  onSave,
  onRemove,
}: {
  initial: Editing;
  onSave: (next: Editing) => void;
  onRemove?: () => void;
}) {
  const isOther = !initial.name;
  const [name, setName] = useState(initial.name);
  const [unit, setUnit] = useState(initial.unit);
  const [text, setText] = useState(formatQty(initial.quantity));
  const quantity = parseQty(text);
  const valid =
    quantity !== null && quantity > 0 && quantity <= MAX_BUWUH_QUANTITY && !!name.trim();

  const step = (delta: number) => {
    const next = Math.max(0, Math.round(((quantity ?? 0) + delta) * 100) / 100);
    setText(formatQty(next));
  };

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (valid) onSave({ ...initial, name, unit, quantity });
  }

  const input =
    "h-14 w-full rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)] px-4 text-lg outline-none focus:border-2 focus:border-[var(--bw-accent)]";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {isOther && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">Nama barang</span>
          <input
            // biome-ignore lint/a11y/noAutofocus: lembar baru dibuka untuk mengetik nama barang
            autoFocus
            value={name}
            maxLength={60}
            autoComplete="off"
            autoCapitalize="sentences"
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Kurangi"
          onClick={() => step(-1)}
          className="bw-press grid size-16 shrink-0 place-items-center rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)]"
        >
          <Minus className="size-7" aria-hidden />
        </button>
        <label className="flex min-w-0 flex-1 flex-col items-center">
          <span className="sr-only">Jumlah</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, ""))}
            className="bw-num h-16 w-full rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)] text-center text-3xl font-extrabold outline-none focus:border-2 focus:border-[var(--bw-accent)]"
          />
        </label>
        <button
          type="button"
          aria-label="Tambah"
          onClick={() => step(1)}
          className="bw-press grid size-16 shrink-0 place-items-center rounded-2xl bg-[var(--bw-accent)] text-[var(--bw-on-accent)]"
        >
          <Plus className="size-7" aria-hidden />
        </button>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Satuan</span>
        <input
          value={unit}
          maxLength={20}
          autoComplete="off"
          placeholder="kg, bungkus, liter…"
          onChange={(e) => setUnit(e.target.value)}
          className={input}
        />
      </label>
      <div className="flex gap-2">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="bw-press h-14 rounded-2xl border border-[var(--bw-line-strong)] px-5 font-bold text-[var(--bw-danger)]"
          >
            Hapus
          </button>
        )}
        <button
          type="submit"
          disabled={!valid}
          className="bw-press h-14 flex-1 rounded-2xl bg-[var(--bw-accent)] text-base font-extrabold text-[var(--bw-on-accent)] disabled:opacity-40"
        >
          Selesai
        </button>
      </div>
    </form>
  );
}
