import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PAYMENT_STATUS_LABEL,
  type Vendor,
  type VendorCategory,
  type VendorOverview,
  type VendorPayment,
} from "@wedding/shared";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/page-header.js";
import { Alert } from "../components/ui/alert.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Card } from "../components/ui/card.js";
import { Dialog } from "../components/ui/dialog.js";
import { Field } from "../components/ui/field.js";
import { Input } from "../components/ui/input.js";
import { Select } from "../components/ui/select.js";
import { Textarea } from "../components/ui/textarea.js";
import { adminApi } from "../lib/admin-api.js";
import { formatRupiah, parseAmount } from "../lib/format.js";
import { useRefresh, vendorsQuery } from "../lib/queries.js";

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="tag text-ink-soft">{label}</p>
      <p className="font-display text-2xl leading-tight font-bold break-words">{value}</p>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </Card>
  );
}

type VendorDialog = { kind: "new"; categoryId?: string } | { kind: "edit"; vendor: Vendor };

export function VendorsPage() {
  const refresh = useRefresh();
  const overview = useQuery(vendorsQuery);
  const [form, setForm] = useState<VendorDialog | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const select = useMutation({
    mutationFn: (v: { id: string; selected: boolean }) => adminApi.vendors.select(v.id, v.selected),
    onSuccess: () => refresh("vendors"),
  });

  const data = overview.data;
  const payingVendor = data?.vendors.find((v) => v.id === paying) ?? null;

  return (
    <>
      <PageHeader
        tag="Vendor"
        title="Vendor"
        description="Bandingkan kandidat vendor per kategori, pilih satu, lalu catat pembayarannya."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
              <Tags className="size-4" aria-hidden /> Kategori
            </Button>
            <Button
              onClick={() => setForm({ kind: "new" })}
              disabled={!data || data.categories.length === 0}
            >
              <Plus className="size-4" aria-hidden /> Tambah vendor
            </Button>
          </>
        }
      />

      {overview.isError && <Alert tone="error">{overview.error.message}</Alert>}
      {select.error && <Alert tone="error">{select.error.message}</Alert>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Vendor terpilih"
              value={`${data.summary.selectedCount} / ${data.summary.categoryCount}`}
              note="kategori sudah punya pilihan"
            />
            <Stat label="Total kontrak" value={formatRupiah(data.summary.contractTotal)} />
            <Stat label="Sudah dibayar" value={formatRupiah(data.summary.paidTotal)} />
            <Stat label="Sisa pembayaran" value={formatRupiah(data.summary.remaining)} />
          </div>

          {data.categories.length === 0 ? (
            <EmptyCategories />
          ) : (
            data.categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                vendors={data.vendors.filter((v) => v.categoryId === category.id)}
                busy={select.isPending}
                onAdd={() => setForm({ kind: "new", categoryId: category.id })}
                onEdit={(vendor) => setForm({ kind: "edit", vendor })}
                onPay={(vendor) => setPaying(vendor.id)}
                onDelete={setDeleting}
                onSelect={(vendor) =>
                  select.mutate({ id: vendor.id, selected: !vendor.isSelected })
                }
              />
            ))
          )}
        </>
      )}

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        wide
        title={form?.kind === "edit" ? "Ubah vendor" : "Tambah vendor"}
      >
        {form && data && (
          <VendorForm
            categories={data.categories}
            vendor={form.kind === "edit" ? form.vendor : null}
            defaultCategoryId={form.kind === "new" ? form.categoryId : undefined}
            onDone={() => setForm(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={payingVendor !== null}
        onClose={() => setPaying(null)}
        wide
        title={`Pembayaran ${payingVendor?.name ?? ""}`}
      >
        {payingVendor && <PaymentsPanel vendor={payingVendor} />}
      </Dialog>

      <Dialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="Kategori vendor"
      >
        {data && <CategoriesPanel overview={data} />}
      </Dialog>

      <DeleteDialog vendor={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function EmptyCategories() {
  const refresh = useRefresh();
  const add = useMutation({
    mutationFn: () => adminApi.vendors.addCommonCategories(),
    onSuccess: () => refresh("vendors"),
  });
  return (
    <Card className="flex flex-col items-start gap-3">
      <p>
        Belum ada kategori. Mulai dengan kategori yang umum untuk pernikahan (katering, dekorasi,
        fotografi, dan lainnya), atau buat sendiri lewat tombol Kategori.
      </p>
      {add.error && <Alert tone="error">{add.error.message}</Alert>}
      <Button onClick={() => add.mutate()} disabled={add.isPending}>
        Tambah kategori umum
      </Button>
    </Card>
  );
}

function CategorySection(props: {
  category: VendorCategory;
  vendors: Vendor[];
  busy: boolean;
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onPay: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
  onSelect: (vendor: Vendor) => void;
}) {
  const { category, vendors } = props;
  return (
    <section className="flex flex-col gap-3" aria-label={category.name}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-2">
        <h2 className="font-display text-xl font-bold tracking-h2 uppercase">{category.name}</h2>
        <Button size="sm" variant="secondary" onClick={props.onAdd}>
          <Plus className="size-4" aria-hidden /> Kandidat
        </Button>
      </div>
      {vendors.length === 0 ? (
        <p className="text-sm text-ink-soft">Belum ada kandidat.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <VendorCard vendor={vendor} {...props} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function VendorCard({
  vendor,
  busy,
  onEdit,
  onPay,
  onDelete,
  onSelect,
}: {
  vendor: Vendor;
  busy: boolean;
  onEdit: (vendor: Vendor) => void;
  onPay: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
  onSelect: (vendor: Vendor) => void;
}) {
  const progress =
    vendor.contractAmount && vendor.contractAmount > 0
      ? Math.min(100, Math.round((vendor.paidTotal / vendor.contractAmount) * 100))
      : null;

  return (
    <Card tone={vendor.isSelected ? "acid" : "paper"} className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold break-words">{vendor.name}</p>
            {vendor.isSelected && <Badge variant="tag">Terpilih</Badge>}
            {vendor.paymentStatus && (
              <Badge variant="pill">{PAYMENT_STATUS_LABEL[vendor.paymentStatus]}</Badge>
            )}
          </div>
          <p className="text-sm">
            {vendor.referencePrice !== null && (
              <>Harga acuan {formatRupiah(vendor.referencePrice)}</>
            )}
            {vendor.referencePrice !== null && vendor.contractAmount !== null && " · "}
            {vendor.contractAmount !== null && (
              <strong>Kontrak {formatRupiah(vendor.contractAmount)}</strong>
            )}
            {vendor.referencePrice === null && vendor.contractAmount === null && "Belum ada harga"}
          </p>
          {(vendor.contactPerson || vendor.phone || vendor.instagram) && (
            <p className="text-sm text-ink-soft">
              {[vendor.contactPerson, vendor.phone, vendor.instagram && `@${vendor.instagram}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {vendor.note && <p className="text-sm break-words whitespace-pre-wrap">{vendor.note}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={vendor.isSelected ? "secondary" : "primary"}
            disabled={busy}
            onClick={() => onSelect(vendor)}
          >
            {vendor.isSelected ? "Batalkan pilihan" : "Pilih vendor ini"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onPay(vendor)}>
            Pembayaran
          </Button>
          <Button size="sm" variant="secondary" aria-label="Ubah" onClick={() => onEdit(vendor)}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            aria-label="Hapus"
            onClick={() => onDelete(vendor)}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      {progress !== null && (
        <div className="flex flex-col gap-1">
          <div
            className="h-3 border-2 border-ink bg-paper"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pembayaran"
          >
            <div className="h-full bg-ink" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs">
            Dibayar {formatRupiah(vendor.paidTotal)} dari {formatRupiah(vendor.contractAmount ?? 0)}
          </p>
        </div>
      )}
    </Card>
  );
}

function VendorForm({
  categories,
  vendor,
  defaultCategoryId,
  onDone,
}: {
  categories: VendorCategory[];
  vendor: Vendor | null;
  defaultCategoryId?: string;
  onDone: () => void;
}) {
  const refresh = useRefresh();
  const [categoryId, setCategoryId] = useState(
    vendor?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [name, setName] = useState(vendor?.name ?? "");
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [instagram, setInstagram] = useState(vendor?.instagram ?? "");
  const [address, setAddress] = useState(vendor?.address ?? "");
  const [reference, setReference] = useState(vendor?.referencePrice?.toString() ?? "");
  const [contract, setContract] = useState(vendor?.contractAmount?.toString() ?? "");
  const [note, setNote] = useState(vendor?.note ?? "");

  const referenceValue = reference.trim() ? parseAmount(reference) : null;
  const contractValue = contract.trim() ? parseAmount(contract) : null;
  const amountsOk =
    (!reference.trim() || (referenceValue ?? 0) > 0) &&
    (!contract.trim() || (contractValue ?? 0) > 0);

  const save = useMutation({
    mutationFn: () => {
      const input = {
        categoryId,
        name,
        contactPerson,
        phone,
        instagram,
        address,
        referencePrice: referenceValue,
        contractAmount: contractValue,
        note,
      };
      return vendor ? adminApi.vendors.update(vendor.id, input) : adminApi.vendors.create(input);
    },
    onSuccess: async () => {
      await refresh("vendors");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori">
          {(id) => (
            <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Nama vendor">
          {(id) => (
            <Input
              id={id}
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </Field>
        <Field label="Nama kontak">
          {(id) => (
            <Input
              id={id}
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          )}
        </Field>
        <Field label="Nomor HP">
          {(id) => (
            <Input
              id={id}
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </Field>
        <Field label="Instagram">
          {(id) => (
            <Input id={id} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          )}
        </Field>
        <Field label="Alamat">
          {(id) => <Input id={id} value={address} onChange={(e) => setAddress(e.target.value)} />}
        </Field>
        <Field
          label="Harga acuan (Rp)"
          hint={
            referenceValue ? formatRupiah(referenceValue) : "Penawaran awal, untuk membandingkan."
          }
        >
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Nilai kontrak (Rp)"
          hint={
            contractValue
              ? formatRupiah(contractValue)
              : "Yang disepakati; dasar status pembayaran."
          }
        >
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label="Catatan">
        {(id) => (
          <Textarea
            id={id}
            className="min-h-20"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={save.isPending || !name.trim() || !categoryId || !amountsOk}
        >
          {save.isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function PaymentsPanel({ vendor }: { vendor: Vendor }) {
  const refresh = useRefresh();
  const [editing, setEditing] = useState<VendorPayment | null>(null);
  const [paidOn, setPaidOn] = useState(todayWib());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsed = parseAmount(amount);
  const reset = () => {
    setEditing(null);
    setPaidOn(todayWib());
    setAmount("");
    setNote("");
  };

  const save = useMutation({
    mutationFn: () => {
      const input = { paidOn, amount: parsed ?? 0, note };
      return editing
        ? adminApi.vendors.updatePayment(vendor.id, editing.id, input)
        : adminApi.vendors.addPayment(vendor.id, input);
    },
    onSuccess: async () => {
      await refresh("vendors");
      reset();
    },
  });
  const remove = useMutation({
    mutationFn: (paymentId: string) => adminApi.vendors.removePayment(vendor.id, paymentId),
    onSuccess: () => refresh("vendors"),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const remaining =
    vendor.contractAmount === null ? null : Math.max(0, vendor.contractAmount - vendor.paidTotal);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        {vendor.contractAmount === null ? (
          "Belum ada nilai kontrak; isi lewat Ubah agar status pembayaran terhitung."
        ) : (
          <>
            Kontrak <strong>{formatRupiah(vendor.contractAmount)}</strong> · dibayar{" "}
            <strong>{formatRupiah(vendor.paidTotal)}</strong> · sisa{" "}
            <strong>{formatRupiah(remaining ?? 0)}</strong>
          </>
        )}
      </p>

      {vendor.payments.length === 0 ? (
        <p className="text-sm text-ink-soft">Belum ada pembayaran.</p>
      ) : (
        <ul className="flex flex-col border-2 border-ink">
          {vendor.payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-ink p-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-semibold">{formatRupiah(payment.amount)}</p>
                <p className="text-xs text-ink-soft">
                  {payment.paidOn}
                  {payment.note ? ` · ${payment.note}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(payment);
                    setPaidOn(payment.paidOn);
                    setAmount(String(payment.amount));
                    setNote(payment.note ?? "");
                  }}
                >
                  Ubah
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(payment.id)}
                >
                  Hapus
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {remove.error && <Alert tone="error">{remove.error.message}</Alert>}

      <form onSubmit={onSubmit} className="flex flex-col gap-3 border-t-2 border-ink pt-4">
        <p className="tag">{editing ? "Ubah pembayaran" : "Catat pembayaran"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tanggal">
            {(id) => (
              <Input
                id={id}
                type="date"
                required
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
              />
            )}
          </Field>
          <Field label="Nominal (Rp)" hint={parsed ? formatRupiah(parsed) : undefined}>
            {(id) => (
              <Input
                id={id}
                required
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Catatan" hint="Mis. DP, termin 2, pelunasan.">
          {(id) => (
            <Input id={id} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
        {save.error && <Alert tone="error">{save.error.message}</Alert>}
        <div className="flex justify-end gap-2">
          {editing && (
            <Button variant="secondary" onClick={reset}>
              Batal ubah
            </Button>
          )}
          <Button type="submit" disabled={save.isPending || !parsed}>
            {save.isPending ? "Menyimpan…" : editing ? "Simpan perubahan" : "Catat"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CategoriesPanel({ overview }: { overview: VendorOverview }) {
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const done = () => refresh("vendors");
  const create = useMutation({
    mutationFn: () => adminApi.vendors.createCategory(name),
    onSuccess: async () => {
      setName("");
      await done();
    },
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) => adminApi.vendors.renameCategory(v.id, v.name),
    onSuccess: async () => {
      setRenaming(null);
      await done();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.vendors.removeCategory(id),
    onSuccess: done,
  });
  const common = useMutation({
    mutationFn: () => adminApi.vendors.addCommonCategories(),
    onSuccess: done,
  });

  const error = create.error ?? rename.error ?? remove.error ?? common.error;
  const count = (id: string) => overview.vendors.filter((v) => v.categoryId === id).length;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col border-2 border-ink">
        {overview.categories.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-ink p-3 last:border-b-0"
          >
            {renaming?.id === category.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  rename.mutate(renaming);
                }}
              >
                <Input
                  aria-label="Nama kategori"
                  value={renaming.name}
                  onChange={(e) => setRenaming({ id: category.id, name: e.target.value })}
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={rename.isPending || !renaming.name.trim()}
                >
                  Simpan
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRenaming(null)}>
                  Batal
                </Button>
              </form>
            ) : (
              <>
                <p className="font-semibold">
                  {category.name}{" "}
                  <span className="text-xs font-normal text-ink-soft">
                    ({count(category.id)} vendor)
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRenaming({ id: category.id, name: category.name })}
                  >
                    Ganti nama
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(category.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
        {overview.categories.length === 0 && (
          <li className="p-3 text-sm text-ink-soft">Belum ada kategori.</li>
        )}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Input
          aria-label="Kategori baru"
          placeholder="Kategori baru"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          Tambah
        </Button>
      </form>
      <Button variant="secondary" onClick={() => common.mutate()} disabled={common.isPending}>
        Tambah kategori umum
      </Button>
      {error && <Alert tone="error">{error.message}</Alert>}
    </div>
  );
}

function DeleteDialog({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.vendors.remove(id),
    onSuccess: async () => {
      await refresh("vendors");
      onClose();
    },
  });

  return (
    <Dialog open={vendor !== null} onClose={onClose} title={`Hapus ${vendor?.name}?`}>
      {vendor && (
        <>
          <p>
            Vendor ini disembunyikan dari daftar dan dilepas dari status terpilih.
            {vendor.payments.length > 0 &&
              " Catatan pembayarannya tidak lagi dihitung di ringkasan."}
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate(vendor.id)}
              disabled={remove.isPending}
            >
              Hapus vendor
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
