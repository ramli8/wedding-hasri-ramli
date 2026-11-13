import type { BuwuhCatalogItem, BuwuhItem, BuwuhKind } from "@wedding/shared";
import type { Ref } from "react";
import { Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { MoneyInput } from "@/components/kit/money-input";
import { Input } from "@/components/ui/input";
import { GoodsGrid } from "../../pages/buwuh/goods-grid.js";

export type BuwuhValue = {
  /** Uang ATAU barang: yang tidak dipilih diabaikan saat disimpan. */
  kind: BuwuhKind;
  name: string;
  address: string;
  amount: number | null;
  items: BuwuhItem[];
};

export const EMPTY_BUWUH: BuwuhValue = {
  kind: "uang",
  name: "",
  address: "",
  amount: null,
  items: [],
};

export type BuwuhErrors = { name: string | null; gift: string | null };

/** Nama wajib; uang lebih dari 0, atau minimal satu barang (sesuai jenis yang dipilih). */
export function buwuhErrors(value: BuwuhValue): BuwuhErrors {
  const gift =
    value.kind === "uang"
      ? (value.amount ?? 0) > 0
        ? null
        : "Isi jumlah uang"
      : value.items.length > 0
        ? null
        : "Pilih minimal satu barang";
  return { name: value.name.trim() ? null : "Nama wajib diisi", gift };
}

/** Bentuk yang dikirim ke server: hanya uang atau hanya barang. */
export function buwuhPayload(value: BuwuhValue) {
  return {
    name: value.name,
    address: value.address,
    amount: value.kind === "uang" ? (value.amount ?? 0) : 0,
    items: value.kind === "barang" ? value.items : [],
  };
}

/** Pecahan uang kertas untuk menghitung isi amplop lembar demi lembar. */
const BANKNOTES = [5_000, 10_000, 20_000, 50_000, 100_000] as const;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Isian satu catatan buwuh di dialog admin: nama, alamat (dengan tombol alamat yang sering dipakai),
 * lalu Uang (dengan tombol pecahan) ATAU Barang (baris − jumlah + yang sama dengan HP meja).
 */
export function BuwuhFields({
  value,
  onChange,
  catalog,
  addresses = [],
  errors,
  nameRef,
  autoFocus,
}: {
  value: BuwuhValue;
  onChange: (next: BuwuhValue) => void;
  catalog: BuwuhCatalogItem[];
  addresses?: string[];
  errors: BuwuhErrors | null;
  nameRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}) {
  const set = (patch: Partial<BuwuhValue>) => onChange({ ...value, ...patch });
  const addressChips = addresses.filter((a) => !sameName(a, value.address));

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nama" required error={errors?.name ?? null}>
        {(id) => (
          <Input
            id={id}
            ref={nameRef}
            autoFocus={autoFocus}
            value={value.name}
            maxLength={120}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => set({ name: e.target.value })}
            className="h-12 text-base md:h-10 md:text-sm"
          />
        )}
      </Field>

      <Field label="Alamat">
        {(id) => (
          <div className="grid gap-2">
            <Input
              id={id}
              value={value.address}
              maxLength={200}
              autoComplete="off"
              autoCapitalize="words"
              onChange={(e) => set({ address: e.target.value })}
              className="h-12 text-base md:h-10 md:text-sm"
            />
            {addressChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addressChips.map((address) => (
                  <Button
                    key={address}
                    size="sm"
                    variant="outline"
                    onClick={() => set({ address })}
                    className="h-10 max-w-full rounded-full md:h-8"
                  >
                    <span className="truncate">{address}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </Field>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Jenis</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["uang", "barang"] as const).map((kind) => (
            <Button
              key={kind}
              variant={value.kind === kind ? "default" : "outline"}
              aria-pressed={value.kind === kind}
              onClick={() => set({ kind })}
              className="h-11 md:h-10"
            >
              {kind === "uang" ? "Uang" : "Barang"}
            </Button>
          ))}
        </div>
      </fieldset>

      {value.kind === "uang" ? (
        <Field label="Uang" required error={errors?.gift ?? null}>
          {(id) => (
            <div className="grid gap-2">
              <MoneyInput
                id={id}
                value={value.amount}
                onValueChange={(amount) => set({ amount })}
                className="h-12 text-base md:h-10 md:text-sm"
              />
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {BANKNOTES.map((note) => (
                  <Button
                    key={note}
                    variant="outline"
                    onClick={() => set({ amount: (value.amount ?? 0) + note })}
                    className="h-11 md:h-9"
                  >
                    +{note / 1000}rb
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  disabled={!value.amount}
                  onClick={() => set({ amount: null })}
                  className="h-11 text-muted-foreground md:h-9"
                >
                  Nol-kan
                </Button>
              </div>
            </div>
          )}
        </Field>
      ) : (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm leading-none font-medium">Barang</legend>
          {errors?.gift && (
            <p data-form-error="" className="text-sm text-destructive">
              {errors.gift}
            </p>
          )}
          {/* Sama dengan HP meja: baris barang dengan tombol − jumlah + (− sampai 0 = hapus). */}
          <div className="buwuh flex flex-col gap-2.5 rounded-xl p-3">
            <GoodsGrid catalog={catalog} items={value.items} onChange={(items) => set({ items })} />
          </div>
        </fieldset>
      )}
    </div>
  );
}
