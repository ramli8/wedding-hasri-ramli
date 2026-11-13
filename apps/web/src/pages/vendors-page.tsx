import { useMutation, useQuery } from "@tanstack/react-query";
import {
  instagramDmUrl,
  type MediaRef,
  nextPaymentKind,
  PAYMENT_STATUS_LABEL,
  VENDOR_PAYMENT_KIND_LABEL,
  VENDOR_PAYMENT_KINDS,
  type Vendor,
  type VendorCategory,
  type VendorOverview,
  type VendorPayment,
  type VendorPaymentKind,
  whatsappUrl,
} from "@wedding/shared";
import {
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Download,
  Ellipsis,
  Eye,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Send,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { DataTableRowActions } from "@/components/data-table/row-actions";
import { ImageField } from "@/components/image-field";
import { Alert } from "@/components/kit/alert";
import { Button } from "@/components/kit/button";
import { Dialog, DialogActions } from "@/components/kit/dialog";
import { Field } from "@/components/kit/field";
import { FormFooter } from "@/components/kit/invitation-kit";
import { MoneyInput } from "@/components/kit/money-input";
import { Select } from "@/components/kit/select";
import { toast } from "@/components/kit/toast";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminApi, downloads } from "../lib/admin-api.js";
import { formatPhone, formatRupiah } from "../lib/format.js";
import { useRefresh, vendorsQuery } from "../lib/queries.js";

const todayWib = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

const dayFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});
/** "2027-05-01" -> "1 Mei 2027". */
const formatDay = (ymd: string) => dayFormat.format(new Date(`${ymd}T00:00:00Z`));

/** Kelas isian: 16px dan 44px di HP (iOS memperbesar layar di bawah 16px). */
const INPUT = "h-11 text-base md:h-9 md:text-sm";

function Stat({
  label,
  value,
  note,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  note?: string;
  icon: typeof Wallet;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0", className)}>
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

type FormState = { kind: "new"; categoryId?: string } | { kind: "edit"; vendor: Vendor };
type PayState = { vendorId: string; payment: VendorPayment | null };

export function VendorsPage() {
  const refresh = useRefresh();
  const overview = useQuery(vendorsQuery);
  const [form, setForm] = useState<FormState | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [paying, setPaying] = useState<PayState | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [comparingId, setComparingId] = useState<string | null>(null);

  const select = useMutation({
    mutationFn: (v: { id: string; selected: boolean }) => adminApi.vendors.select(v.id, v.selected),
    meta: { toast: false },
    onSuccess: async ({ vendor }) => {
      await refresh("vendors");
      toast(vendor.isSelected ? `${vendor.name} dipesan` : `${vendor.name} kembali jadi kandidat`);
    },
  });

  const data = overview.data;
  const categoryName = new Map(data?.categories.map((c) => [c.id, c.name]));
  const order = new Map(data?.categories.map((c, i) => [c.id, i]));
  // Kandidat satu kategori berdekatan: yang dipesan dulu, lalu dari harga termurah.
  const vendors = [...(data?.vendors ?? [])].sort(
    (a, b) =>
      (order.get(a.categoryId) ?? 0) - (order.get(b.categoryId) ?? 0) ||
      Number(b.isSelected) - Number(a.isSelected) ||
      (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER),
  );
  const detail = data?.vendors.find((v) => v.id === detailId) ?? null;
  const payingVendor = data?.vendors.find((v) => v.id === paying?.vendorId) ?? null;

  const actions: RowActions = {
    busy: select.isPending,
    onDetail: (vendor) => setDetailId(vendor.id),
    onEdit: (vendor) => setForm({ kind: "edit", vendor }),
    onSelect: (vendor, selected) => select.mutate({ id: vendor.id, selected }),
    onPay: (vendor) => setPaying({ vendorId: vendor.id, payment: null }),
    onDelete: setDeleting,
  };

  return (
    <>
      <PageHeader
        title="Vendor"
        description="Bandingkan kandidat, pilih satu per kategori, lalu catat DP dan pembayarannya."
        actions={
          <>
            <Button onClick={() => setForm({ kind: "new" })} disabled={!data?.categories.length}>
              Tambah vendor
              <Plus aria-hidden />
            </Button>
            <MoreMenu onCategories={() => setCategoriesOpen(true)} />
          </>
        }
      />

      {overview.isError && <Alert tone="error">{overview.error.message}</Alert>}
      {select.error && <Alert tone="error">{select.error.message}</Alert>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat
              icon={Receipt}
              label="Total dipesan"
              value={formatRupiah(data.summary.contractTotal)}
              note={`${data.summary.selectedCount} dari ${data.summary.categoryCount} kategori sudah dipesan`}
              className="max-sm:col-span-2"
            />
            <Stat
              icon={CircleDollarSign}
              label="Sudah dibayar"
              value={formatRupiah(data.summary.paidTotal)}
            />
            <Stat
              icon={Wallet}
              label="Sisa"
              value={formatRupiah(data.summary.remaining)}
              note={dueNote(data)}
            />
          </div>

          {data.categories.length === 0 ? (
            <EmptyCategories />
          ) : (
            <Tabs defaultValue="daftar" className="gap-4">
              <TabsList>
                <TabsTrigger value="daftar">Daftar</TabsTrigger>
                <TabsTrigger value="hari-h">Hari-H</TabsTrigger>
              </TabsList>
              <TabsContent value="daftar">
                <CategoryBoard
                  categories={data.categories}
                  vendors={vendors}
                  actions={actions}
                  onCompare={setComparingId}
                />
              </TabsContent>
              <TabsContent value="hari-h">
                <DayOfList vendors={vendors} categoryName={categoryName} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      <Dialog
        open={comparingId !== null}
        onClose={() => setComparingId(null)}
        wide
        title={`${categoryName.get(comparingId ?? "") ?? ""}: bandingkan`}
      >
        {comparingId && (
          <CompareList
            vendors={vendors.filter((v) => v.categoryId === comparingId)}
            actions={actions}
            onAdd={() => setForm({ kind: "new", categoryId: comparingId })}
          />
        )}
      </Dialog>

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
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
        open={detail !== null}
        onClose={() => setDetailId(null)}
        wide
        title={detail?.name ?? ""}
        description={detail ? categoryName.get(detail.categoryId) : undefined}
      >
        {detail && (
          <VendorDetail
            vendor={detail}
            busy={select.isPending}
            onSelect={(selected) => select.mutate({ id: detail.id, selected })}
            onEdit={() => {
              setDetailId(null);
              setForm({ kind: "edit", vendor: detail });
            }}
            onPay={(payment) => setPaying({ vendorId: detail.id, payment })}
          />
        )}
      </Dialog>

      <Dialog
        open={payingVendor !== null}
        onClose={() => setPaying(null)}
        title={paying?.payment ? "Ubah pembayaran" : `Bayar ${payingVendor?.name ?? ""}`}
      >
        {payingVendor && paying && (
          <PaymentForm
            vendor={payingVendor}
            payment={paying.payment}
            onDone={() => setPaying(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        title="Kategori vendor"
      >
        {data && <CategoriesPanel overview={data} />}
      </Dialog>

      <DeleteVendorDialog vendor={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function dueNote(data: VendorOverview): string | undefined {
  const { overdueCount, dueSoonCount } = data.summary;
  const parts = [
    overdueCount > 0 && `${overdueCount} lewat batas pelunasan`,
    dueSoonCount > 0 && `${dueSoonCount} segera jatuh tempo`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Aksi yang jarang dipakai dikumpulkan di satu menu agar header ringkas di HP. */
function MoreMenu({ onCategories }: { onCategories: () => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Lainnya">
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onCategories}>
          <Tags />
          Kategori
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={downloads.vendorsXlsx}>
            <Download />
            Ekspor Excel
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Bilah dibayar/harga dan penanda batas pelunasan; hanya untuk vendor yang dipesan. */
function PaymentProgress({ vendor }: { vendor: Vendor }) {
  if (!vendor.isSelected && vendor.payments.length === 0) return <span aria-hidden />;
  if (vendor.price === null) {
    return <span className="text-sm text-muted-foreground">Harga belum diisi</span>;
  }
  const percent = Math.min(100, Math.round((vendor.paidTotal / vendor.price) * 100));
  return (
    <div className="grid min-w-36 gap-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">
          {vendor.paymentStatus === "lunas"
            ? "Lunas"
            : `Sisa ${formatRupiah(vendor.remaining ?? 0)}`}
        </span>
        <span className="text-muted-foreground tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pembayaran"
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {vendor.dueState && vendor.dueOn && (
        <span
          className={cn(
            "text-xs",
            vendor.dueState === "terlambat" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {vendor.dueState === "terlambat" ? "Lewat batas " : "Lunasi sebelum "}
          {formatDay(vendor.dueOn)}
        </span>
      )}
    </div>
  );
}

type RowActions = {
  busy: boolean;
  onDetail: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onSelect: (vendor: Vendor, selected: boolean) => void;
  onPay: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

/**
 * Papan kategori: satu kartu per kategori yang sudah punya kandidat. Kartu menonjolkan vendor yang
 * dipesan beserta pembayarannya; yang belum dipilih menampilkan ringkasan kandidat dan tombol
 * Bandingkan. Kategori tanpa kandidat tidak ditampilkan (tambah lewat "Tambah vendor").
 */
function CategoryBoard({
  categories,
  vendors,
  actions,
  onCompare,
}: {
  categories: VendorCategory[];
  vendors: Vendor[];
  actions: RowActions;
  onCompare: (categoryId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const needle = search.trim().toLowerCase();
  const groups = categories
    .map((category) => {
      const all = vendors.filter((v) => v.categoryId === category.id);
      return { category, all, booked: all.find((v) => v.isSelected) ?? null };
    })
    .filter(
      (g) =>
        g.all.length > 0 &&
        (!onlyOpen || !g.booked) &&
        (!needle ||
          g.category.name.toLowerCase().includes(needle) ||
          g.all.some((v) => v.name.toLowerCase().includes(needle))),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Cari vendor atau kategori"
          placeholder="Cari vendor atau kategori"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(INPUT, "w-full sm:w-64")}
        />
        <Button
          variant={onlyOpen ? "default" : "outline"}
          aria-pressed={onlyOpen}
          onClick={() => setOnlyOpen((v) => !v)}
          className="h-11 md:h-9"
        >
          Belum dipilih
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          {vendors.length === 0
            ? "Belum ada vendor. Klik “Tambah vendor” untuk mencatat kandidat pertama."
            : needle
              ? "Tidak ada vendor yang cocok."
              : "Semua kategori sudah punya vendor dipesan."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(({ category, all, booked }) => (
            <li key={category.id} className="flex">
              <CategoryCard
                name={category.name}
                all={all}
                booked={booked}
                actions={actions}
                onCompare={() => onCompare(category.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryCard({
  name,
  all,
  booked,
  actions,
  onCompare,
}: {
  name: string;
  all: Vendor[];
  booked: Vendor | null;
  actions: RowActions;
  onCompare: () => void;
}) {
  const prices = all.flatMap((v) => (v.price === null ? [] : [v.price]));
  const cheapest = prices.length > 0 ? Math.min(...prices) : null;
  const late = booked?.dueState === "terlambat";

  return (
    <Card
      className={cn(
        "w-full gap-3 py-4",
        booked && "border-2 border-primary",
        late && "border-destructive",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4">
        <button
          type="button"
          onClick={onCompare}
          className="min-w-0 text-start text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline"
        >
          {name}
        </button>
        <span className="shrink-0 text-xs text-muted-foreground">{all.length} kandidat</span>
      </div>

      {booked ? (
        <>
          <div className="grid gap-1 px-4">
            <button
              type="button"
              onClick={() => actions.onDetail(booked)}
              className="flex min-w-0 items-center gap-2 text-start"
            >
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate text-lg font-semibold underline-offset-4 hover:underline">
                {booked.name}
              </span>
            </button>
            <p className="text-sm font-medium tabular-nums">
              {booked.price !== null ? formatRupiah(booked.price) : "Harga belum diisi"}
            </p>
          </div>
          <div className="px-4">
            <PaymentProgress vendor={booked} />
          </div>
          <div className="mt-auto flex gap-2 px-4">
            <Button size="sm" onClick={() => actions.onPay(booked)} className="h-11 flex-1 md:h-8">
              <Wallet aria-hidden />
              Bayar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.onDetail(booked)}
              className="h-11 flex-1 md:h-8"
            >
              Detail
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-1 px-4">
            <p className="text-lg font-semibold text-muted-foreground">Belum dipilih</p>
            <p className="text-sm">
              {cheapest !== null
                ? `${prices.length > 1 ? "mulai " : ""}${formatRupiah(cheapest)}`
                : "Harga belum diisi"}
            </p>
          </div>
          <div className="mt-auto px-4">
            <Button size="sm" variant="outline" onClick={onCompare} className="h-11 w-full md:h-8">
              {all.length > 1 ? "Bandingkan" : "Lihat kandidat"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/** Kandidat satu kategori berdampingan: yang dipesan dulu, lalu dari harga termurah. */
function CompareList({
  vendors,
  actions,
  onAdd,
}: {
  vendors: Vendor[];
  actions: RowActions;
  onAdd: () => void;
}) {
  const prices = vendors.flatMap((v) => (v.price === null ? [] : [v.price]));
  const cheapest = prices.length > 1 ? Math.min(...prices) : null;

  return (
    <div className="flex flex-col gap-4">
      {vendors.length === 0 ? (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">Belum ada kandidat.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {vendors.map((vendor) => (
            <li
              key={vendor.id}
              className={cn("flex items-center gap-3 p-3", vendor.isSelected && "bg-primary/5")}
            >
              <button
                type="button"
                onClick={() => actions.onDetail(vendor)}
                className="min-w-0 flex-1 text-start"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium break-words underline-offset-4 hover:underline">
                    {vendor.name}
                  </span>
                  {vendor.isSelected && <Badge>Dipesan</Badge>}
                  {cheapest !== null && vendor.price === cheapest && (
                    <Badge variant="secondary">Termurah</Badge>
                  )}
                </span>
                <span className="block text-sm tabular-nums text-muted-foreground">
                  {vendor.price !== null ? formatRupiah(vendor.price) : "Harga belum diisi"}
                </span>
              </button>
              {vendor.isSelected ? (
                <Button size="sm" variant="outline" onClick={() => actions.onPay(vendor)}>
                  <Wallet aria-hidden />
                  Bayar
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={actions.busy}
                  onClick={() => actions.onSelect(vendor, true)}
                >
                  <Check aria-hidden />
                  Pilih
                </Button>
              )}
              <DataTableRowActions
                actions={[
                  {
                    label: "Lihat detail",
                    icon: <Eye />,
                    onSelect: () => actions.onDetail(vendor),
                  },
                  { label: "Ubah", icon: <Pencil />, onSelect: () => actions.onEdit(vendor) },
                  ...(vendor.isSelected
                    ? [
                        {
                          label: "Batalkan pilihan",
                          icon: <Check />,
                          onSelect: () => actions.onSelect(vendor, false),
                        },
                      ]
                    : []),
                  "separator" as const,
                  {
                    label: "Hapus",
                    icon: <Trash2 />,
                    destructive: true,
                    onSelect: () => actions.onDelete(vendor),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" onClick={onAdd} className="self-start">
        <Plus aria-hidden />
        Kandidat
      </Button>
    </div>
  );
}

function EmptyCategories() {
  const refresh = useRefresh();
  const add = useMutation({
    mutationFn: () => adminApi.vendors.addCommonCategories(),
    onSuccess: () => refresh("vendors"),
  });
  return (
    <Card className="flex flex-col items-start gap-3 px-6">
      <p>
        Belum ada kategori. Mulai dengan kategori yang umum untuk pernikahan (katering, dekorasi,
        fotografi, dan lainnya), atau buat sendiri lewat menu ⋯ → Kategori.
      </p>
      {add.error && <Alert tone="error">{add.error.message}</Alert>}
      <Button onClick={() => add.mutate()} disabled={add.isPending}>
        Tambah kategori umum
      </Button>
    </Card>
  );
}

// --- Hari-H ---------------------------------------------------------------------------------------

/** Vendor yang dipesan, urut jam datang: pegangan koordinasi di hari acara. */
function DayOfList({
  vendors,
  categoryName,
}: {
  vendors: Vendor[];
  categoryName: Map<string, string>;
}) {
  const booked = vendors
    .filter((v) => v.isSelected)
    .sort((a, b) => (a.arrivalTime ?? "99:99").localeCompare(b.arrivalTime ?? "99:99"));
  if (booked.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        Belum ada vendor yang dipesan.
      </p>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {booked.map((vendor) => {
        const phone = vendor.picPhone ?? vendor.phone;
        return (
          <li key={vendor.id} className="flex gap-4 rounded-lg border p-4">
            <div className="w-14 shrink-0 text-center">
              <p className="text-lg font-bold tabular-nums">{vendor.arrivalTime ?? "—"}</p>
              <p className="text-xs text-muted-foreground">datang</p>
            </div>
            <div className="grid min-w-0 flex-1 content-start gap-1">
              <p className="font-semibold break-words">{vendor.name}</p>
              <p className="text-xs text-muted-foreground">{categoryName.get(vendor.categoryId)}</p>
              <p className="text-sm">
                {vendor.picName ?? vendor.contactPerson ?? "PIC belum diisi"}
                {phone && <span className="text-muted-foreground"> · {formatPhone(phone)}</span>}
              </p>
              {phone && (
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappUrl(phone, "")} target="_blank" rel="noopener">
                      <MessageCircle aria-hidden />
                      WhatsApp
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:+${phone}`}>
                      <Phone aria-hidden />
                      Telepon
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// --- Detail ---------------------------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function VendorDetail({
  vendor,
  busy,
  onSelect,
  onEdit,
  onPay,
}: {
  vendor: Vendor;
  busy: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onPay: (payment: VendorPayment | null) => void;
}) {
  const refresh = useRefresh();
  const [deleting, setDeleting] = useState<VendorPayment | null>(null);
  const remove = useMutation({
    mutationFn: (paymentId: string) => adminApi.vendors.removePayment(vendor.id, paymentId),
    meta: { toast: "Terhapus" },
    onSuccess: () => refresh("vendors"),
  });
  const hasDayOf = vendor.arrivalTime || vendor.picName || vendor.picPhone;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {vendor.isSelected ? <Badge>Dipesan</Badge> : <Badge variant="outline">Kandidat</Badge>}
        {vendor.paymentStatus && vendor.isSelected && (
          <Badge variant="secondary">{PAYMENT_STATUS_LABEL[vendor.paymentStatus]}</Badge>
        )}
        {vendor.dueState === "terlambat" && <Badge variant="destructive">Lewat batas</Badge>}
      </div>

      {(vendor.phone || vendor.instagram) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {vendor.phone && (
            <Button variant="outline" asChild>
              <a href={whatsappUrl(vendor.phone, "")} target="_blank" rel="noopener">
                <MessageCircle aria-hidden />
                WhatsApp {formatPhone(vendor.phone)}
              </a>
            </Button>
          )}
          {vendor.instagram && (
            <Button variant="outline" asChild>
              <a href={instagramDmUrl(vendor.instagram)} target="_blank" rel="noopener">
                <Send aria-hidden />
                Instagram @{vendor.instagram}
              </a>
            </Button>
          )}
        </div>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <InfoRow label="Harga">{vendor.price !== null ? formatRupiah(vendor.price) : "—"}</InfoRow>
        {vendor.dueOn && <InfoRow label="Batas pelunasan">{formatDay(vendor.dueOn)}</InfoRow>}
        {vendor.contactPerson && <InfoRow label="Kontak">{vendor.contactPerson}</InfoRow>}
        {vendor.address && <InfoRow label="Alamat">{vendor.address}</InfoRow>}
        {vendor.note && (
          <InfoRow label="Catatan">
            <span className="whitespace-pre-wrap">{vendor.note}</span>
          </InfoRow>
        )}
      </dl>

      {hasDayOf && (
        <section className="grid gap-2 rounded-lg border p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4" aria-hidden />
            Hari-H
          </h3>
          <p className="text-sm">
            {vendor.arrivalTime && <>Datang {vendor.arrivalTime} WIB · </>}
            {vendor.picName ?? "PIC"}
            {vendor.picPhone && (
              <>
                {" · "}
                <a
                  href={whatsappUrl(vendor.picPhone, "")}
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-4"
                >
                  {formatPhone(vendor.picPhone)}
                </a>
              </>
            )}
          </p>
        </section>
      )}

      {(vendor.isSelected || vendor.payments.length > 0) && (
        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Pembayaran</h3>
            {vendor.isSelected && (
              <Button size="sm" onClick={() => onPay(null)}>
                <Wallet aria-hidden />
                Bayar
              </Button>
            )}
          </div>
          {vendor.price !== null && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Harga", vendor.price],
                  ["Dibayar", vendor.paidTotal],
                  ["Sisa", vendor.remaining ?? 0],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold break-words">{formatRupiah(value)}</p>
                </div>
              ))}
            </div>
          )}
          {vendor.payments.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Belum ada pembayaran.
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border">
              {vendor.payments.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 p-3">
                  {payment.proof ? (
                    <a
                      href={payment.proof.large}
                      target="_blank"
                      rel="noopener"
                      className="size-11 shrink-0 overflow-hidden rounded-md border"
                      aria-label="Lihat bukti bayar"
                    >
                      <img src={payment.proof.thumb} alt="" className="size-full object-cover" />
                    </a>
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-md border bg-muted/40">
                      <Receipt className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{formatRupiah(payment.amount)}</span>
                      <Badge variant="secondary">{VENDOR_PAYMENT_KIND_LABEL[payment.kind]}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDay(payment.paidOn)}
                      {payment.note ? ` · ${payment.note}` : ""}
                    </p>
                  </div>
                  <DataTableRowActions
                    actions={[
                      { label: "Ubah", icon: <Pencil />, onSelect: () => onPay(payment) },
                      "separator",
                      {
                        label: "Hapus",
                        icon: <Trash2 />,
                        destructive: true,
                        disabled: remove.isPending,
                        onSelect: () => setDeleting(payment),
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
        </section>
      )}

      <DialogActions>
        <Button variant="outline" onClick={onEdit}>
          <Pencil aria-hidden />
          Ubah
        </Button>
        <Button
          variant={vendor.isSelected ? "outline" : "default"}
          disabled={busy}
          onClick={() => onSelect(!vendor.isSelected)}
        >
          {vendor.isSelected ? (
            "Batalkan pilihan"
          ) : (
            <>
              <Check aria-hidden />
              Pilih vendor ini
            </>
          )}
        </Button>
      </DialogActions>

      <Dialog open={deleting !== null} onClose={() => setDeleting(null)} title="Hapus pembayaran?">
        {deleting && (
          <>
            <p className="text-sm text-muted-foreground">
              {VENDOR_PAYMENT_KIND_LABEL[deleting.kind]} {formatRupiah(deleting.amount)} tanggal{" "}
              {formatDay(deleting.paidOn)} dihapus permanen, beserta foto buktinya.
            </p>
            <DialogActions>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  remove.mutate(deleting.id);
                  setDeleting(null);
                }}
              >
                Hapus pembayaran
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}

// --- Formulir vendor ------------------------------------------------------------------------------

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
  const [categoryId, setCategoryId] = useState(vendor?.categoryId ?? defaultCategoryId ?? "");
  const [name, setName] = useState(vendor?.name ?? "");
  const [price, setPrice] = useState<number | null>(vendor?.price ?? null);
  const [phone, setPhone] = useState(vendor?.phone ? formatPhone(vendor.phone) : "");
  const [instagram, setInstagram] = useState(vendor?.instagram ?? "");
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson ?? "");
  const [address, setAddress] = useState(vendor?.address ?? "");
  const [dueOn, setDueOn] = useState(vendor?.dueOn ?? "");
  const [arrivalTime, setArrivalTime] = useState(vendor?.arrivalTime ?? "");
  const [picName, setPicName] = useState(vendor?.picName ?? "");
  const [picPhone, setPicPhone] = useState(vendor?.picPhone ? formatPhone(vendor.picPhone) : "");
  const [note, setNote] = useState(vendor?.note ?? "");
  const [more, setMore] = useState(
    () =>
      vendor !== null &&
      Boolean(
        vendor.contactPerson ||
          vendor.address ||
          vendor.dueOn ||
          vendor.arrivalTime ||
          vendor.picName ||
          vendor.picPhone ||
          vendor.note,
      ),
  );
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: !name.trim() ? "Nama vendor wajib diisi" : null,
    category: !categoryId ? "Pilih kategori" : null,
  };
  const valid = !errors.name && !errors.category;
  const shown = (error: string | null) => (submitted ? error : null);

  const save = useMutation({
    mutationFn: () => {
      const input = {
        categoryId,
        name,
        price,
        phone,
        instagram,
        contactPerson,
        address,
        dueOn: dueOn || null,
        arrivalTime,
        picName,
        picPhone,
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
    setSubmitted(true);
    if (valid) save.mutate();
  }

  const text = (
    label: string,
    value: string,
    set: (v: string) => void,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <Field label={label}>
      {(id) => (
        <Input
          id={id}
          autoComplete="off"
          value={value}
          onChange={(e) => set(e.target.value)}
          className={INPUT}
          {...props}
        />
      )}
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Nama vendor" required error={shown(errors.name)}>
        {(id) => (
          <Input
            id={id}
            autoFocus
            autoComplete="off"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <Field label="Kategori" required error={shown(errors.category)}>
        {(id) => (
          <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>
              Pilih kategori…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Harga">
        {(id) => <MoneyInput id={id} value={price} onValueChange={setPrice} className={INPUT} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("No. HP", phone, setPhone, {
          type: "tel",
          inputMode: "tel",
          placeholder: "08…",
          maxLength: 30,
        })}
        {text("Instagram", instagram, setInstagram, {
          placeholder: "@username",
          autoCapitalize: "none",
          spellCheck: false,
          maxLength: 100,
        })}
      </div>

      {more ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("Nama kontak", contactPerson, setContactPerson, { maxLength: 120 })}
            {text("Batas pelunasan", dueOn, setDueOn, { type: "date" })}
          </div>
          {text("Alamat", address, setAddress, { maxLength: 300 })}
          <div className="grid gap-4 sm:grid-cols-3">
            {text("Jam datang hari-H", arrivalTime, setArrivalTime, { type: "time" })}
            {text("PIC hari-H", picName, setPicName, { maxLength: 120 })}
            {text("HP PIC", picPhone, setPicPhone, {
              type: "tel",
              inputMode: "tel",
              placeholder: "08…",
              maxLength: 30,
            })}
          </div>
          <Field label="Catatan">
            {(id) => (
              <Textarea
                id={id}
                className="min-h-20 text-base md:text-sm"
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>
        </>
      ) : (
        <Button variant="outline" onClick={() => setMore(true)}>
          Lainnya: batas pelunasan, hari-H, catatan
          <ChevronDown aria-hidden />
        </Button>
      )}

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

// --- Pembayaran -----------------------------------------------------------------------------------

function PaymentForm({
  vendor,
  payment,
  onDone,
}: {
  vendor: Vendor;
  payment: VendorPayment | null;
  onDone: () => void;
}) {
  const refresh = useRefresh();
  // Sisa sebelum pembayaran ini: saat mengubah, nominal lama tidak ikut mengurangi.
  const remainingBefore =
    vendor.price === null
      ? null
      : Math.max(0, vendor.price - vendor.paidTotal + (payment?.amount ?? 0));
  const [kind, setKind] = useState<VendorPaymentKind>(
    payment?.kind ?? nextPaymentKind(vendor.payments.length),
  );
  const [amount, setAmount] = useState<number | null>(payment?.amount ?? null);
  const [paidOn, setPaidOn] = useState(payment?.paidOn ?? todayWib());
  const [note, setNote] = useState(payment?.note ?? "");
  const [proof, setProof] = useState<MediaRef | null>(payment?.proof ?? null);
  const [submitted, setSubmitted] = useState(false);

  const amountError = !(amount && amount > 0) ? "Nominal wajib diisi" : null;

  function chooseKind(next: VendorPaymentKind) {
    setKind(next);
    // Pelunasan = seluruh sisa; jenis lain dibiarkan diisi sendiri.
    if (next === "pelunasan" && remainingBefore) setAmount(remainingBefore);
  }

  const save = useMutation({
    mutationFn: () => {
      const input = { kind, amount: amount ?? 0, paidOn, note, proofMediaId: proof?.id ?? null };
      return payment
        ? adminApi.vendors.updatePayment(vendor.id, payment.id, input)
        : adminApi.vendors.addPayment(vendor.id, input);
    },
    onSuccess: async () => {
      await refresh("vendors");
      onDone();
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!amountError) save.mutate();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {remainingBefore !== null && (
        <p className="text-sm text-muted-foreground">
          Harga {formatRupiah(vendor.price ?? 0)} · sisa {formatRupiah(remainingBefore)}
        </p>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Jenis</legend>
        <div className="grid grid-cols-3 gap-2">
          {VENDOR_PAYMENT_KINDS.map((value) => (
            <Button
              key={value}
              variant={kind === value ? "default" : "outline"}
              aria-pressed={kind === value}
              onClick={() => chooseKind(value)}
              className="h-11 md:h-10"
            >
              {VENDOR_PAYMENT_KIND_LABEL[value]}
            </Button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nominal" required error={submitted ? amountError : null}>
          {(id) => (
            <MoneyInput
              id={id}
              autoFocus
              value={amount}
              onValueChange={setAmount}
              className={INPUT}
            />
          )}
        </Field>
        <Field label="Tanggal">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className={INPUT}
            />
          )}
        </Field>
      </div>
      <Field label="Catatan">
        {(id) => (
          <Input
            id={id}
            autoComplete="off"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <ImageField label="Foto bukti" value={proof} onChange={setProof} />

      {save.error && <Alert tone="error">{save.error.message}</Alert>}
      <FormFooter onCancel={onDone} pending={save.isPending} />
    </form>
  );
}

// --- Kategori -------------------------------------------------------------------------------------

function CategoriesPanel({ overview }: { overview: VendorOverview }) {
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<VendorCategory | null>(null);

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
    meta: { toast: "Terhapus" },
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
                  if (renaming.name.trim()) rename.mutate(renaming);
                }}
              >
                <Input
                  aria-label="Nama kategori"
                  autoFocus
                  value={renaming.name}
                  onChange={(e) => setRenaming({ id: category.id, name: e.target.value })}
                  className={INPUT}
                />
                <Button size="sm" type="submit" disabled={rename.isPending}>
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
                  <p className="text-xs text-muted-foreground">{count(category.id)} vendor</p>
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
                      onSelect: () => setDeleting(category),
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
          if (name.trim()) create.mutate();
        }}
      >
        <Input
          aria-label="Kategori baru"
          placeholder="Kategori baru"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT}
        />
        <Button type="submit" disabled={create.isPending} className="h-11 md:h-9">
          Tambah
        </Button>
      </form>
      <Button variant="outline" onClick={() => common.mutate()} disabled={common.isPending}>
        Tambah kategori umum
      </Button>
      {error && <Alert tone="error">{error.message}</Alert>}

      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Hapus kategori ${deleting?.name ?? ""}?`}
      >
        {deleting && (
          <>
            <p className="text-sm text-muted-foreground">
              {count(deleting.id) > 0
                ? `Kategori ini masih berisi ${count(deleting.id)} vendor. Hapus atau pindahkan vendornya dulu.`
                : "Kategori dihapus dari daftar."}
            </p>
            <DialogActions>
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={count(deleting.id) > 0}
                onClick={() => {
                  remove.mutate(deleting.id);
                  setDeleting(null);
                }}
              >
                Hapus kategori
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}

function DeleteVendorDialog({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) {
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.vendors.remove(id),
    meta: { toast: "Terhapus" },
    onSuccess: async () => {
      await refresh("vendors");
      onClose();
    },
  });

  return (
    <Dialog open={vendor !== null} onClose={onClose} title={`Hapus ${vendor?.name ?? ""}?`}>
      {vendor && (
        <>
          <p className="text-sm text-muted-foreground">
            {vendor.payments.length > 0
              ? `Vendor ini punya ${vendor.payments.length} catatan pembayaran (${formatRupiah(vendor.paidTotal)}). Semuanya ikut hilang dari daftar.`
              : "Vendor dihapus dari daftar."}
          </p>
          {remove.error && <Alert tone="error">{remove.error.message}</Alert>}
          <DialogActions>
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
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
