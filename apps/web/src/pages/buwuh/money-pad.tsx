import { MAX_BUWUH_AMOUNT } from "@wedding/shared";
import { RotateCcw } from "lucide-react";

const grouped = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/**
 * Pecahan rupiah dari yang terbesar (dua kolom, sesuai urutan yang diminta pemilik). Isi amplop di
 * desa selalu kelipatan pecahan ini, jadi tidak ada papan angka: petugas cukup mengetuk lembar demi
 * lembar. Tiap tombol meniru uang kertas TE 2022: gradasi pastel dari terang ke warna utamanya
 * (diambil dari gambar uang asli; koin 500 perak), angka berwarna gelap senada, kontras ≥ 4,5:1.
 */
const BANKNOTES = [
  { value: 100_000, from: "#f5e7eb", to: "#da9aa4", ink: "#6e1f2e" },
  { value: 50_000, from: "#d2e3e9", to: "#70a7cf", ink: "#0f3354" },
  { value: 20_000, from: "#ebf0e8", to: "#71c08f", ink: "#133f24" },
  { value: 10_000, from: "#e0dde9", to: "#b0a2d1", ink: "#35265e" },
  { value: 5_000, from: "#f4eee3", to: "#d2a174", ink: "#4f2e12" },
  { value: 2_000, from: "#dae2e7", to: "#98a2af", ink: "#262d38" },
  { value: 1_000, from: "#f7f3d4", to: "#c9c78a", ink: "#3f3e10" },
  { value: 500, from: "#eeeff1", to: "#bfc3c7", ink: "#33363a" },
] as const;

const label = (value: number) => grouped.format(value);

/** Isian uang ala kasir: angka besar, tombol pecahan besar, dan satu tombol Kosongkan. */
export function MoneyPad({
  amount,
  onChange,
}: {
  amount: number;
  onChange: (amount: number) => void;
}) {
  const add = (value: number) => {
    if (amount + value <= MAX_BUWUH_AMOUNT) onChange(amount + value);
  };

  return (
    <div className="flex flex-col gap-3">
      <output
        aria-live="polite"
        aria-label="Jumlah uang"
        className="flex flex-col items-center rounded-2xl bg-[var(--bw-surface)] px-4 py-5 shadow-[0_1px_2px_rgb(28_25_23/0.06),0_8px_24px_rgb(28_25_23/0.06)]"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-[var(--bw-muted)]">Rp</span>
          <span
            className={`bw-num text-[2.75rem] leading-none font-extrabold tracking-tight ${amount ? "" : "text-[var(--bw-line-strong)]"}`}
          >
            {grouped.format(amount)}
          </span>
        </span>
      </output>

      <div className="grid grid-cols-2 gap-2.5">
        {BANKNOTES.map((note) => (
          <button
            key={note.value}
            type="button"
            onClick={() => add(note.value)}
            aria-label={`Tambah ${grouped.format(note.value)} rupiah`}
            className="bw-press flex h-[72px] items-center justify-center rounded-2xl border shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
            style={{
              background: `linear-gradient(105deg, ${note.from} 15%, ${note.to} 100%)`,
              borderColor: note.to,
              color: note.ink,
            }}
          >
            <span className="bw-num text-2xl font-extrabold">{label(note.value)}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          disabled={amount === 0}
          className="bw-press col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--bw-key)] text-base font-bold disabled:opacity-40"
        >
          <RotateCcw className="size-5" aria-hidden />
          Kosongkan
        </button>
      </div>
    </div>
  );
}
