import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PAYMENT_STATUS_LABEL,
  type Vendor,
  type VendorCategory,
  type VendorOverview,
  type VendorPayment,
} from "@wedding/shared";
import {
  Check,
  CircleDollarSign,
  type LucideIcon,
  Pencil,
  Plus,
  Receipt,
  Store,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormSection } from "@/components/kit/form-rows";
import { FormFooter } from "@/components/kit/invitation-kit";
import { Select } from "@/components/kit/select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "../lib/admin-api.js";
import { formatRupiah, parseAmount } from "../lib/format.js";
import { useRefresh, vendorsQuery } from "../lib/queries.js";

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold break-words">{value}</div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
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
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const select = useMutation({
    mutationFn: (v: { id: string; selected: boolean }) => adminApi.vendors.select(v.id, v.selected),
    onSuccess: () => refresh("vendors"),
  });

  const data = overview.data;
  const activeCategory = data?.categories.find((c) => c.id === categoryId) ?? data?.categories[0];
  const payingVendor = data?.vendors.find((v) => v.id === paying) ?? null;

  return (
    <>
      <PageHeader
        title="Vendor"
        description="Bandingkan kandidat vendor per kategori, pilih satu, lalu catat pembayarannya."
        actions={
          <>
            <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={Store}
              label="Vendor terpilih"
              value={`${data.summary.selectedCount} / ${data.summary.categoryCount}`}
              note="kategori sudah punya pilihan"
            />
            <Stat
              icon={Receipt}
              label="Total kontrak"
              value={formatRupiah(data.summary.contractTotal)}
            />
            <Stat
              icon={CircleDollarSign}
              label="Sudah dibayar"
              value={formatRupiah(data.summary.paidTotal)}
            />
            <Stat
              icon={Wallet}
              label="Sisa pembayaran"
              value={formatRupiah(data.summary.remaining)}
              note={
                data.summary.overdueCount + data.summary.dueSoonCount > 0
                  ? `${data.summary.overdueCount} terlambat · ${data.summary.dueSoonCount} segera`
                  : undefined
              }
            />
          </div>

          {data.categories.length === 0 ? (
            <EmptyCategories />
          ) : (
            <Tabs value={activeCategory?.id} onValueChange={setCategoryId} className="gap-4">
              <div className="w-full overflow-x-auto pb-2">
                <TabsList>
                  {data.categories.map((category) => {
                    const count = data.vendors.filter((v) => v.categoryId === category.id);
                    return (
                      <TabsTrigger key={category.id} value={category.id}>
                        {category.name}
                        {count.some((v) => v.isSelected) && (
                          <Check className="size-3.5" aria-hidden />
                        )}
                        <span className="text-xs text-muted-foreground">{count.length}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              {data.categories.map((category) => (
                <TabsContent key={category.id} value={category.id}>
                  <CategorySection
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
                </TabsContent>
              ))}
            </Tabs>
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
    <Card className="px-6 flex flex-col items-start gap-3">
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
    <section className="flex flex-col gap-4" aria-label={category.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <p className="text-sm text-muted-foreground">
            Tambahkan beberapa kandidat, bandingkan harganya, lalu pilih satu.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={props.onAdd}>
          <Plus aria-hidden /> Kandidat
        </Button>
      </div>
      {vendors.length === 0 ? (
        <Card className="items-center px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Belum ada kandidat untuk kategori ini.</p>
          <Button onClick={props.onAdd}>
            Tambah kandidat pertama
            <Plus aria-hidden />
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <li key={vendor.id} className="flex">
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
    <Card className={`w-full gap-4 ${vendor.isSelected ? "border-primary" : ""}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base break-words">{vendor.name}</CardTitle>
            <CardDescription>
              {[vendor.contactPerson, vendor.phone, vendor.instagram && `@${vendor.instagram}`]
                .filter(Boolean)
                .join(" · ") || "Kontak belum diisi"}
            </CardDescription>
          </div>
          <DataTableRowActions
            actions={[
              { label: "Ubah", icon: <Pencil />, onSelect: () => onEdit(vendor) },
              "separator",
              {
                label: "Hapus",
                icon: <Trash2 />,
                destructive: true,
                onSelect: () => onDelete(vendor),
              },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent className="grid flex-1 content-start gap-3">
        <div className="flex flex-wrap gap-1.5">
          {vendor.isSelected && <Badge>Terpilih</Badge>}
          {vendor.paymentStatus && (
            <Badge variant="outline">{PAYMENT_STATUS_LABEL[vendor.paymentStatus]}</Badge>
          )}
          {vendor.dueState && (
            <Badge variant={vendor.dueState === "terlambat" ? "destructive" : "secondary"}>
              {vendor.dueState === "terlambat" ? "Terlambat" : "Segera jatuh tempo"}
            </Badge>
          )}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Harga acuan</dt>
          <dd>{vendor.referencePrice !== null ? formatRupiah(vendor.referencePrice) : "—"}</dd>
          <dt className="text-muted-foreground">Kontrak</dt>
          <dd className="font-medium">
            {vendor.contractAmount !== null ? formatRupiah(vendor.contractAmount) : "—"}
          </dd>
          {vendor.dueOn && vendor.paymentStatus !== "lunas" && (
            <>
              <dt className="text-muted-foreground">Jatuh tempo</dt>
              <dd>
                {vendor.dueOn}
                {vendor.dueAmount !== null && <> · {formatRupiah(vendor.dueAmount)}</>}
              </dd>
            </>
          )}
        </dl>
        {vendor.note && (
          <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {vendor.note}
          </p>
        )}
        {progress !== null && (
          <div className="grid gap-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Pembayaran"
            >
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Dibayar {formatRupiah(vendor.paidTotal)} dari{" "}
              {formatRupiah(vendor.contractAmount ?? 0)}
            </p>
          </div>
        )}
      </CardContent>
      <div className="flex gap-2 px-6">
        <Button
          size="sm"
          variant={vendor.isSelected ? "outline" : "default"}
          disabled={busy}
          onClick={() => onSelect(vendor)}
          className="flex-1"
        >
          {vendor.isSelected ? "Batalkan pilihan" : "Pilih vendor ini"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPay(vendor)}>
          Pembayaran
        </Button>
      </div>
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
  const [dueOn, setDueOn] = useState(vendor?.dueOn ?? "");
  const [due, setDue] = useState(vendor?.dueAmount?.toString() ?? "");
  const [note, setNote] = useState(vendor?.note ?? "");

  const referenceValue = reference.trim() ? parseAmount(reference) : null;
  const contractValue = contract.trim() ? parseAmount(contract) : null;
  const dueValue = due.trim() ? parseAmount(due) : null;
  const amountsOk =
    (!due.trim() || (dueValue ?? 0) > 0) &&
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
        dueOn: dueOn || null,
        dueAmount: dueValue,
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
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormSection title="Vendor">
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
        </div>
      </FormSection>

      <FormSection title="Kontak" description="Opsional, untuk menghubungi vendor dengan cepat.">
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </FormSection>

      <FormSection
        title="Biaya dan jatuh tempo"
        description="Harga acuan untuk membandingkan kandidat; nilai kontrak menjadi dasar status pembayaran."
      >
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jatuh tempo berikutnya" hint="Perbarui setelah tiap pembayaran.">
            {(id) => (
              <Input id={id} type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
            )}
          </Field>
          <Field
            label="Nominal jatuh tempo (Rp)"
            hint={dueValue ? formatRupiah(dueValue) : "Opsional."}
          >
            {(id) => (
              <Input
                id={id}
                inputMode="numeric"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            )}
          </Field>
        </div>
      </FormSection>

      <Field label="Catatan" hint="Mis. paket yang ditawarkan, syarat, atau kesan saat bertemu.">
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
      <FormFooter
        onCancel={onDone}
        pending={save.isPending}
        disabled={!name.trim() || !categoryId || !amountsOk}
      />
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
    <div className="flex flex-col gap-5">
      {vendor.contractAmount === null ? (
        <Alert>Belum ada nilai kontrak; isi lewat Ubah agar status pembayaran terhitung.</Alert>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              ["Kontrak", vendor.contractAmount],
              ["Dibayar", vendor.paidTotal],
              ["Sisa", remaining ?? 0],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold break-words sm:text-base">
                {formatRupiah(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="grid gap-2">
        <h3 className="text-sm font-semibold">Riwayat pembayaran</h3>
        {vendor.payments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Belum ada pembayaran.
          </p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {vendor.payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{formatRupiah(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.paidOn}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <DataTableRowActions
                  actions={[
                    {
                      label: "Ubah",
                      icon: <Pencil />,
                      onSelect: () => {
                        setEditing(payment);
                        setPaidOn(payment.paidOn);
                        setAmount(String(payment.amount));
                        setNote(payment.note ?? "");
                      },
                    },
                    "separator",
                    {
                      label: "Hapus",
                      icon: <Trash2 />,
                      destructive: true,
                      disabled: remove.isPending,
                      onSelect: () => remove.mutate(payment.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
        {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
      </section>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">
          {editing ? "Ubah pembayaran" : "Catat pembayaran"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {editing && (
            <Button variant="outline" onClick={reset}>
              Batal ubah
            </Button>
          )}
          <Button type="submit" disabled={save.isPending || !parsed}>
            {save.isPending ? "Menyimpan…" : editing ? "Simpan perubahan" : "Catat pembayaran"}
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
      <ul className="divide-y overflow-hidden rounded-lg border">
        {overview.categories.map((category) => (
          <li key={category.id} className="flex items-center gap-3 p-3">
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
                  autoFocus
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
                <Button size="sm" variant="outline" onClick={() => setRenaming(null)}>
                  Batal
                </Button>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{count(category.id)} kandidat</p>
                </div>
                <DataTableRowActions
                  actions={[
                    {
                      label: "Ganti nama",
                      icon: <Pencil />,
                      onSelect: () => setRenaming({ id: category.id, name: category.name }),
                    },
                    "separator",
                    {
                      label: "Hapus",
                      icon: <Trash2 />,
                      destructive: true,
                      disabled: remove.isPending,
                      onSelect: () => remove.mutate(category.id),
                    },
                  ]}
                />
              </>
            )}
          </li>
        ))}
        {overview.categories.length === 0 && (
          <li className="p-4 text-center text-sm text-muted-foreground">Belum ada kategori.</li>
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
          placeholder="Kategori baru, mis. Katering"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending || !name.trim()}>
          Tambah
        </Button>
      </form>
      <Button variant="outline" onClick={() => common.mutate()} disabled={common.isPending}>
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
          <p className="text-sm text-muted-foreground">
            {vendor.payments.length > 0
              ? `Vendor ini punya ${vendor.payments.length} catatan pembayaran (${formatRupiah(vendor.paidTotal)}). Semuanya ikut terhapus permanen.`
              : "Vendor dihapus dari daftar kandidat."}
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
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
