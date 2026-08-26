"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  ExternalLink,
  Gift,
  Inbox,
  Layers,
  Loader2,
  Plus,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/src/presentation/components/ui/card";
import { Input } from "@/src/presentation/components/ui/input";
import { Label } from "@/src/presentation/components/ui/label";
import { Switch } from "@/src/presentation/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/presentation/components/ui/alert-dialog";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useEwallets,
  useCreateEwallet,
  useUpdateEwallet,
  useDeleteEwallet,
  useWishlistItems,
  useCreateWishlistItem,
  useUpdateWishlistItem,
  useDeleteWishlistItem,
  useUpdateWedding,
} from "@/src/application/hooks/use-wedding-query";
import type {
  BankAccountResponse,
  EwalletResponse,
  WeddingResponse,
  WishlistItemResponse,
} from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "./wedding-save";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";
import { deleteUploadedFiles } from "./upload-cleanup";

type GiftSegment = "bank" | "ewallet" | "wishlist";

interface BankFormState {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  imageUrl: string | null;
}

interface EwalletFormState {
  providerName: string;
  accountId: string;
  qrCodeImageUrl: string | null;
  isQris: boolean;
}

interface WishlistFormState {
  itemName: string;
  itemImageUrl: string | null;
  itemLink: string;
  stockTotal: number;
}

const EMPTY_BANK_FORM: BankFormState = {
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
  imageUrl: null,
};

const EMPTY_EWALLET_FORM: EwalletFormState = {
  providerName: "",
  accountId: "",
  qrCodeImageUrl: null,
  isQris: false,
};

const EMPTY_WISHLIST_FORM: WishlistFormState = {
  itemName: "",
  itemImageUrl: null,
  itemLink: "",
  stockTotal: 1,
};

const SEGMENTS: { key: GiftSegment; label: string; icon: typeof Building2 }[] =
  [
    { key: "bank", label: "Bank", icon: Building2 },
    { key: "ewallet", label: "E-Wallet", icon: Smartphone },
    { key: "wishlist", label: "Wishlist", icon: Gift },
  ];

export function GiftsTab({ data }: { data?: WeddingResponse }) {
  const [segment, setSegment] = useState<GiftSegment>("bank");
  const updateWedding = useUpdateWedding();
  const [address, setAddress] = useState(data?.gift_shipping_address ?? "");
  useEffect(() => {
    setAddress(data?.gift_shipping_address ?? "");
  }, [data?.gift_shipping_address]);

  const handleAddressSave = () => {
    updateWedding.mutate(
      buildSaveRequest(data, { gift_shipping_address: address.trim() || null }),
      {
        onSuccess: () => toast.success("Alamat pengiriman kado tersimpan"),
        onError: () => toast.error("Gagal menyimpan alamat pengiriman"),
      }
    );
  };

  const { data: banks, isLoading: banksLoading } = useBankAccounts();
  const { data: ewallets, isLoading: ewalletsLoading } = useEwallets();
  const { data: wishlist, isLoading: wishlistLoading } = useWishlistItems();
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const createEwallet = useCreateEwallet();
  const updateEwallet = useUpdateEwallet();
  const deleteEwallet = useDeleteEwallet();
  const createWishlistItem = useCreateWishlistItem();
  const updateWishlistItem = useUpdateWishlistItem();
  const deleteWishlistItem = useDeleteWishlistItem();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingEwalletId, setEditingEwalletId] = useState<string | null>(null);
  const [editingWishlistId, setEditingWishlistId] = useState<string | null>(
    null
  );
  const [bankForm, setBankForm] = useState<BankFormState>(EMPTY_BANK_FORM);
  const [ewalletForm, setEwalletForm] =
    useState<EwalletFormState>(EMPTY_EWALLET_FORM);
  const [wishlistForm, setWishlistForm] =
    useState<WishlistFormState>(EMPTY_WISHLIST_FORM);
  const [deleteBank, setDeleteBank] = useState<BankAccountResponse | null>(
    null
  );
  const [deleteEwalletTarget, setDeleteEwalletTarget] =
    useState<EwalletResponse | null>(null);
  const [deleteWishlistTarget, setDeleteWishlistTarget] =
    useState<WishlistItemResponse | null>(null);

  const isLoading =
    (segment === "bank" && banksLoading) ||
    (segment === "ewallet" && ewalletsLoading) ||
    (segment === "wishlist" && wishlistLoading);

  const openCreate = () => {
    if (segment === "bank") {
      setEditingBankId(null);
      setBankForm(EMPTY_BANK_FORM);
    } else if (segment === "ewallet") {
      setEditingEwalletId(null);
      setEwalletForm(EMPTY_EWALLET_FORM);
    } else {
      setEditingWishlistId(null);
      setWishlistForm(EMPTY_WISHLIST_FORM);
    }
    setSheetOpen(true);
  };

  const openEditBank = (account: BankAccountResponse) => {
    setSegment("bank");
    setEditingBankId(account.id);
    setBankForm({
      bankName: account.bank_name,
      accountNumber: account.account_number,
      accountHolderName: account.account_holder_name,
      imageUrl: account.image_url,
    });
    setSheetOpen(true);
  };

  const openEditEwallet = (ewallet: EwalletResponse) => {
    setSegment("ewallet");
    setEditingEwalletId(ewallet.id);
    setEwalletForm({
      providerName: ewallet.provider_name,
      accountId: ewallet.account_id,
      qrCodeImageUrl: ewallet.qr_code_image_url,
      isQris: ewallet.is_qris,
    });
    setSheetOpen(true);
  };

  const openEditWishlist = (item: WishlistItemResponse) => {
    setSegment("wishlist");
    setEditingWishlistId(item.id);
    setWishlistForm({
      itemName: item.item_name,
      itemImageUrl: item.item_image_url,
      itemLink: item.item_link ?? "",
      stockTotal: item.stock_total,
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (segment === "bank") {
      if (
        !bankForm.bankName.trim() ||
        !bankForm.accountNumber.trim() ||
        !bankForm.accountHolderName.trim()
      ) {
        toast.error("Nama bank, no. rekening, dan nama pemilik wajib diisi");
        return;
      }
      const payload = {
        bank_name: bankForm.bankName.trim(),
        account_number: bankForm.accountNumber.trim(),
        account_holder_name: bankForm.accountHolderName.trim(),
        image_url: bankForm.imageUrl,
      };
      if (editingBankId) {
        const previous =
          banks?.find((b) => b.id === editingBankId)?.image_url ?? null;
        updateBankAccount.mutate(
          { id: editingBankId, req: payload },
          {
            onSuccess: () => {
              if (previous && previous !== payload.image_url) {
                deleteUploadedFiles([previous]);
              }
              toast.success("Rekening tersimpan");
              setSheetOpen(false);
            },
            onError: () => toast.error("Gagal menyimpan rekening"),
          }
        );
      } else {
        createBankAccount.mutate(payload, {
          onSuccess: () => {
            toast.success("Rekening ditambahkan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menambah rekening"),
        });
      }
    } else if (segment === "ewallet") {
      if (!ewalletForm.providerName.trim() || !ewalletForm.accountId.trim()) {
        toast.error("Provider dan account ID wajib diisi");
        return;
      }
      const payload = {
        provider_name: ewalletForm.providerName.trim(),
        account_id: ewalletForm.accountId.trim(),
        qr_code_image_url: ewalletForm.qrCodeImageUrl,
        is_qris: ewalletForm.isQris,
      };
      if (editingEwalletId) {
        const previous =
          ewallets?.find((e) => e.id === editingEwalletId)?.qr_code_image_url ??
          null;
        updateEwallet.mutate(
          { id: editingEwalletId, req: payload },
          {
            onSuccess: () => {
              if (previous && previous !== payload.qr_code_image_url) {
                deleteUploadedFiles([previous]);
              }
              toast.success("E-Wallet tersimpan");
              setSheetOpen(false);
            },
            onError: () => toast.error("Gagal menyimpan e-wallet"),
          }
        );
      } else {
        createEwallet.mutate(payload, {
          onSuccess: () => {
            toast.success("E-Wallet ditambahkan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menambah e-wallet"),
        });
      }
    } else {
      if (!wishlistForm.itemName.trim()) {
        toast.error("Nama kado wajib diisi");
        return;
      }
      const payload = {
        item_name: wishlistForm.itemName.trim(),
        item_image_url: wishlistForm.itemImageUrl,
        item_link: wishlistForm.itemLink.trim() || null,
        stock_total: Number.isNaN(wishlistForm.stockTotal)
          ? 1
          : Math.max(1, wishlistForm.stockTotal),
      };
      if (editingWishlistId) {
        const previous =
          wishlist?.find((w) => w.id === editingWishlistId)?.item_image_url ??
          null;
        updateWishlistItem.mutate(
          { id: editingWishlistId, req: payload },
          {
            onSuccess: () => {
              if (previous && previous !== payload.item_image_url) {
                deleteUploadedFiles([previous]);
              }
              toast.success("Kado tersimpan");
              setSheetOpen(false);
            },
            onError: () => toast.error("Gagal menyimpan kado"),
          }
        );
      } else {
        createWishlistItem.mutate(payload, {
          onSuccess: () => {
            toast.success("Kado ditambahkan");
            setSheetOpen(false);
          },
          onError: () => toast.error("Gagal menambah kado"),
        });
      }
    }
  };

  const handleDelete = () => {
    if (deleteBank) {
      const media = deleteBank.image_url;
      deleteBankAccount.mutate(deleteBank.id, {
        onSuccess: () => {
          deleteUploadedFiles([media]);
          toast.success("Rekening dihapus");
        },
        onError: () => toast.error("Gagal menghapus rekening"),
        onSettled: () => setDeleteBank(null),
      });
    } else if (deleteEwalletTarget) {
      const media = deleteEwalletTarget.qr_code_image_url;
      deleteEwallet.mutate(deleteEwalletTarget.id, {
        onSuccess: () => {
          deleteUploadedFiles([media]);
          toast.success("E-Wallet dihapus");
        },
        onError: () => toast.error("Gagal menghapus e-wallet"),
        onSettled: () => setDeleteEwalletTarget(null),
      });
    } else if (deleteWishlistTarget) {
      const media = deleteWishlistTarget.item_image_url;
      deleteWishlistItem.mutate(deleteWishlistTarget.id, {
        onSuccess: () => {
          deleteUploadedFiles([media]);
          toast.success("Kado dihapus");
        },
        onError: () => toast.error("Gagal menghapus kado"),
        onSettled: () => setDeleteWishlistTarget(null),
      });
    }
  };

  const handleToggleBank = (account: BankAccountResponse, checked: boolean) => {
    updateBankAccount.mutate(
      { id: account.id, req: { is_active: checked } },
      { onError: () => toast.error("Gagal mengubah status rekening") }
    );
  };

  const handleToggleEwallet = (ewallet: EwalletResponse, checked: boolean) => {
    updateEwallet.mutate(
      { id: ewallet.id, req: { is_active: checked } },
      { onError: () => toast.error("Gagal mengubah status e-wallet") }
    );
  };

  if (isLoading) return <TabLoading />;

  const isPending =
    createBankAccount.isPending ||
    updateBankAccount.isPending ||
    createEwallet.isPending ||
    updateEwallet.isPending ||
    createWishlistItem.isPending ||
    updateWishlistItem.isPending;
  const deletePending =
    deleteBankAccount.isPending ||
    deleteEwallet.isPending ||
    deleteWishlistItem.isPending;
  const editingId =
    segment === "bank"
      ? editingBankId
      : segment === "ewallet"
      ? editingEwalletId
      : editingWishlistId;

  const counts: Record<GiftSegment, number> = {
    bank: (banks ?? []).length,
    ewallet: (ewallets ?? []).length,
    wishlist: (wishlist ?? []).length,
  };
  const segmentLabels: Record<GiftSegment, string> = {
    bank: "rekening",
    ewallet: "e-wallet",
    wishlist: "kado",
  };

  return (
    <div className="space-y-4">
      {/* Alamat pengiriman kado */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="space-y-1.5 p-4">
          <Label
            htmlFor="shipping-address"
            className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Alamat Pengiriman Kado (opsional)
          </Label>
          <Textarea
            id="shipping-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Alamat tujuan pengiriman kado fisik"
            className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
          />
          <button
            onClick={handleAddressSave}
            disabled={updateWedding.isPending}
            className="mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {updateWedding.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Simpan Alamat"
            )}
          </button>
        </CardContent>
      </Card>

      {/* Segmented pill */}
      <div className="flex bg-muted/40 p-1 rounded-xl h-11">
        {SEGMENTS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSegment(key)}
            className={`flex-1 flex items-center justify-center gap-1 text-[12px] sm:text-[13px] font-semibold rounded-lg transition-all ${
              segment === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between px-2 min-h-[32px]">
        <span className="text-sm font-semibold tracking-tight">
          Semua{" "}
          {segment === "bank"
            ? "Rekening"
            : segment === "ewallet"
            ? "E-Wallet"
            : "Kado"}{" "}
          ({counts[segment]})
        </span>
        {segment === "wishlist" && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />1 tamu = 1 kado
          </span>
        )}
      </div>

      {segment === "bank" && (
        <>
          {(banks ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-16 w-16 opacity-20" />
              <p className="text-[13px] text-muted-foreground">
                Belum ada rekening. Tambahkan kanal kado pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(banks ?? []).map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => openEditBank(account)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-[14px] font-semibold">
                        {account.bank_name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        a.n. {account.account_holder_name}
                      </p>
                    </button>
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleBank(account, checked)
                      }
                      aria-label="Aktifkan rekening"
                    />
                  </div>
                  {/* InfoBox nomor rekening */}
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-2.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                      No. Rekening
                    </span>
                    <span className="text-[15px] font-bold tabular-nums tracking-wide">
                      {account.account_number}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                    <button
                      onClick={() => openEditBank(account)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteBank(account)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {segment === "ewallet" && (
        <>
          {(ewallets ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-16 w-16 opacity-20" />
              <p className="text-[13px] text-muted-foreground">
                Belum ada e-wallet. Tambahkan kanal kado digital.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(ewallets ?? []).map((ewallet) => (
                <div
                  key={ewallet.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => openEditEwallet(ewallet)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {ewallet.qr_code_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ewallet.qr_code_image_url}
                          alt={`QR ${ewallet.provider_name}`}
                          className="h-12 w-12 shrink-0 rounded-lg border border-border/60 object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                          <Smartphone className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold">
                          {ewallet.provider_name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                          {ewallet.account_id}
                        </span>
                      </span>
                    </button>
                    <Switch
                      checked={ewallet.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleEwallet(ewallet, checked)
                      }
                      aria-label="Aktifkan e-wallet"
                    />
                  </div>
                  <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                    <button
                      onClick={() => openEditEwallet(ewallet)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteEwalletTarget(ewallet)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {segment === "wishlist" && (
        <>
          {(wishlist ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Inbox className="h-16 w-16 opacity-20" />
              <p className="text-[13px] text-muted-foreground">
                Belum ada kado. Tambahkan daftar keinginan pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(wishlist ?? []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    {item.item_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="h-14 w-14 shrink-0 rounded-xl border border-border/60 object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                        <Gift className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">
                        {item.item_name}
                      </p>
                      {item.item_link && (
                        <a
                          href={item.item_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[12px] font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">Link produk</span>
                        </a>
                      )}
                    </div>
                  </div>
                  {/* InfoBox stok */}
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-2.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                      Sudah dipilih
                    </span>
                    <span className="text-[13px] font-bold tabular-nums">
                      {item.claimed_count} dari {item.stock_total}
                    </span>
                  </div>
                  {item.claimed_by_names && item.claimed_by_names.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.claimed_by_names.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                    <button
                      onClick={() => openEditWishlist(item)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteWishlistTarget(item)}
                      className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label={`Tambah ${segmentLabels[segment]}`}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom sheet create/edit */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSheetOpen(false)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                {editingId
                  ? segment === "bank"
                    ? "Edit Rekening"
                    : segment === "ewallet"
                    ? "Edit E-Wallet"
                    : "Edit Kado"
                  : segment === "bank"
                  ? "Tambah Rekening"
                  : segment === "ewallet"
                  ? "Tambah E-Wallet"
                  : "Tambah Kado"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {segment === "bank" && (
              <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bank-name"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Nama Bank
                  </Label>
                  <Input
                    id="bank-name"
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm((f) => ({ ...f, bankName: e.target.value }))
                    }
                    placeholder="Cth: BCA"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bank-number"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Nomor Rekening
                  </Label>
                  <Input
                    id="bank-number"
                    inputMode="numeric"
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm((f) => ({
                        ...f,
                        accountNumber: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="Cth: 1234567890"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="bank-holder"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Nama Pemilik
                  </Label>
                  <Input
                    id="bank-holder"
                    value={bankForm.accountHolderName}
                    onChange={(e) =>
                      setBankForm((f) => ({
                        ...f,
                        accountHolderName: e.target.value,
                      }))
                    }
                    placeholder="Cth: Ramli Pratama"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <MediaInput
                  label="Foto Buku Tabungan (Opsional)"
                  hint="Rekomendasi 800 × 800 px"
                  value={bankForm.imageUrl}
                  onChange={(v) => setBankForm((f) => ({ ...f, imageUrl: v }))}
                  accept="image/*"
                  folder="wedding"
                  preview="image"
                />
              </div>
            )}

            {segment === "ewallet" && (
              <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ewallet-provider"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Provider
                  </Label>
                  <Input
                    id="ewallet-provider"
                    value={ewalletForm.providerName}
                    onChange={(e) =>
                      setEwalletForm((f) => ({
                        ...f,
                        providerName: e.target.value,
                      }))
                    }
                    placeholder="Cth: GoPay / OVO / DANA"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ewallet-account"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Nomor / Account ID
                  </Label>
                  <Input
                    id="ewallet-account"
                    value={ewalletForm.accountId}
                    onChange={(e) =>
                      setEwalletForm((f) => ({
                        ...f,
                        accountId: e.target.value,
                      }))
                    }
                    placeholder="Cth: 081234567890"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <MediaInput
                  label="QR Code (Opsional)"
                  hint="Rekomendasi 800 × 800 px"
                  value={ewalletForm.qrCodeImageUrl}
                  onChange={(v) =>
                    setEwalletForm((f) => ({ ...f, qrCodeImageUrl: v }))
                  }
                  accept="image/*"
                  folder="wedding"
                  preview="image"
                />
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-[13px] font-medium">
                      Tampilkan sebagai QRIS
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      QR scanner hanya muncul untuk QRIS
                    </p>
                  </div>
                  <Switch
                    checked={ewalletForm.isQris}
                    onCheckedChange={(v) =>
                      setEwalletForm((f) => ({ ...f, isQris: v }))
                    }
                  />
                </label>
              </div>
            )}

            {segment === "wishlist" && (
              <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="wishlist-name"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Nama Kado
                  </Label>
                  <Input
                    id="wishlist-name"
                    value={wishlistForm.itemName}
                    onChange={(e) =>
                      setWishlistForm((f) => ({
                        ...f,
                        itemName: e.target.value,
                      }))
                    }
                    placeholder="Cth: Air Fryer"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <MediaInput
                  label="Foto Kado (Opsional)"
                  hint="Rekomendasi 800 × 800 px"
                  value={wishlistForm.itemImageUrl}
                  onChange={(v) =>
                    setWishlistForm((f) => ({ ...f, itemImageUrl: v }))
                  }
                  accept="image/*"
                  folder="wedding"
                  preview="image"
                />
                <div className="space-y-1.5">
                  <Label
                    htmlFor="wishlist-link"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Link Toko (Opsional)
                  </Label>
                  <Input
                    id="wishlist-link"
                    value={wishlistForm.itemLink}
                    onChange={(e) =>
                      setWishlistForm((f) => ({
                        ...f,
                        itemLink: e.target.value,
                      }))
                    }
                    placeholder="https://tokopedia.com/..."
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="wishlist-stock"
                    className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1"
                  >
                    Jumlah Unit
                  </Label>
                  <Input
                    id="wishlist-stock"
                    type="number"
                    min={1}
                    value={wishlistForm.stockTotal}
                    onChange={(e) =>
                      setWishlistForm((f) => ({
                        ...f,
                        stockTotal: parseInt(e.target.value, 10),
                      }))
                    }
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                  <p className="pl-1 text-[10px] font-medium tracking-wide text-muted-foreground/70">
                    Satu tamu hanya bisa memilih satu kado.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={
          deleteBank !== null ||
          deleteEwalletTarget !== null ||
          deleteWishlistTarget !== null
        }
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBank(null);
            setDeleteEwalletTarget(null);
            setDeleteWishlistTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteBank
                ? "Hapus rekening?"
                : deleteEwalletTarget
                ? "Hapus e-wallet?"
                : "Hapus kado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBank
                ? `Rekening ${deleteBank.bank_name} akan dihapus permanen.`
                : deleteEwalletTarget
                ? `E-Wallet ${deleteEwalletTarget.provider_name} akan dihapus permanen.`
                : `Kado "${deleteWishlistTarget?.item_name}" akan dihapus permanen.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
