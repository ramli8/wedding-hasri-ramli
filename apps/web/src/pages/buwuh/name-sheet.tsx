import { Check, Loader2, Plus } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { BottomSheet } from "./bottom-sheet.js";

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Langkah terakhir: siapa yang memberi, dibuat secepat mungkin. Nama diketik langsung (boleh lewat
 * mikrofon keyboard); alamat dipilih dari tombol (daftar alamat yang diatur admin), dan hanya alamat
 * di luar daftar yang diketik lewat "Lainnya". Lembar naik di atas keyboard dan tombol Simpan
 * menempel di dasarnya; Enter di Nama menutup keyboard supaya tombol alamat terlihat.
 */
export function NameSheet({
  open,
  onClose,
  summary,
  name,
  address,
  onNameChange,
  onAddressChange,
  addresses,
  editing,
  busy,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  summary: string;
  name: string;
  address: string;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  addresses: string[];
  editing: boolean;
  busy: boolean;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const [showError, setShowError] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const inList = addresses.some((a) => sameText(a, address));
  // "Lainnya" terbuka bila dipilih, bila alamat yang ada di luar daftar, atau bila daftar kosong.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (open) setTyping(false);
  }, [open]);
  const showInput = typing || addresses.length === 0 || (!!address.trim() && !inList);
  const missingName = !name.trim();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (missingName) {
      setShowError(true);
      nameRef.current?.focus();
      return;
    }
    setShowError(false);
    onSave();
  }

  const input =
    "h-14 w-full rounded-2xl border border-[var(--bw-line-strong)] bg-[var(--bw-surface)] px-4 text-lg outline-none focus:border-2 focus:border-[var(--bw-accent)]";
  const chip =
    "bw-press h-11 max-w-full truncate rounded-full border px-4 text-[15px] font-semibold";
  const chipOn = "border-[var(--bw-accent)] bg-[var(--bw-accent)] text-[var(--bw-on-accent)]";
  const chipOff = "border-[var(--bw-line-strong)] bg-[var(--bw-surface)]";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={<span className="block truncate">{editing ? `Ubah · ${summary}` : summary}</span>}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="buwuh-nama" className="text-sm font-bold">
            Nama
          </label>
          <input
            id="buwuh-nama"
            ref={nameRef}
            // biome-ignore lint/a11y/noAutofocus: lembar dibuka khusus untuk mengetik nama
            autoFocus
            value={name}
            maxLength={120}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint={addresses.length > 0 ? "done" : "next"}
            aria-invalid={showError && missingName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              // Tutup keyboard supaya tombol alamat terlihat; tanpa daftar, pindah ke kolom alamat.
              if (showInput) document.getElementById("buwuh-alamat")?.focus();
              else e.currentTarget.blur();
            }}
            className={`${input} font-semibold ${showError && missingName ? "border-2 border-[var(--bw-danger)]" : ""}`}
          />
          {showError && missingName && (
            <span className="text-sm font-semibold text-[var(--bw-danger)]">Nama wajib diisi</span>
          )}
        </div>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="mb-1.5 text-sm font-bold">Alamat</legend>
          {addresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {addresses.map((value) => {
                const on = sameText(value, address);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setTyping(false);
                      onAddressChange(on ? "" : value);
                    }}
                    className={`${chip} ${on ? chipOn : chipOff}`}
                  >
                    {value}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={showInput}
                onClick={() => {
                  setTyping(true);
                  if (inList) onAddressChange("");
                  requestAnimationFrame(() => document.getElementById("buwuh-alamat")?.focus());
                }}
                className={`${chip} flex items-center gap-1 border-dashed ${showInput ? chipOn : chipOff}`}
              >
                <Plus className="size-4" aria-hidden />
                Lainnya
              </button>
            </div>
          )}
          {showInput && (
            <input
              id="buwuh-alamat"
              aria-label="Alamat lainnya"
              value={inList ? "" : address}
              maxLength={200}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              onChange={(e) => onAddressChange(e.target.value)}
              className={`${input} mt-1`}
            />
          )}
        </fieldset>

        {/* Menempel di dasar lembar: tetap terlihat walau isi lembar lebih tinggi dari layar. */}
        <div className="sticky -bottom-4 -mx-4 mt-1 flex flex-col gap-1 bg-[var(--bw-surface)] px-4 pt-1 pb-1">
          <button
            type="submit"
            disabled={busy}
            className="bw-press flex h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--bw-accent)] text-[17px] font-extrabold text-[var(--bw-on-accent)] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-5" strokeWidth={2.5} aria-hidden />
            )}
            {editing ? "Simpan perubahan" : "Simpan"}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-11 text-sm font-bold text-[var(--bw-danger)]"
            >
              Hapus catatan ini
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}
