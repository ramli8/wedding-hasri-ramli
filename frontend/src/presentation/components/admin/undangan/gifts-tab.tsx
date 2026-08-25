"use client";

import { useEffect, useState } from "react";
import { Building2, Inbox, Loader2, Plus, Smartphone, Trash2, X } from "lucide-react";
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
  useUpdateWedding,
} from "@/src/application/hooks/use-wedding-query";
import type {
  BankAccountResponse,
  EwalletResponse,
  WeddingResponse,
} from "@/src/domain/services/wedding.service";
import { buildSaveRequest } from "./wedding-save";
import { TabLoading } from "./tab-loading";
import { MediaInput } from "./media-input";

type GiftSegment = "bank" | "ewallet";

interface BankFormState {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

interface EwalletFormState {
  providerName: string;
  accountId: string;
  qrCodeImageUrl: string | null;
}

const EMPTY_BANK_FORM: BankFormState = {
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
};

const EMPTY_EWALLET_FORM: EwalletFormState = {
  providerName: "",
  accountId: "",
  qrCodeImageUrl: null,
};

export function GiftsTab({ data }: { data?: WeddingResponse }) {
  const [segment, setSegment] = useState<GiftSegment>("bank");
  const updateWedding = useUpdateWedding();
  const [address, setAddress] = useState(
    data?.gift_shipping_address ?? ""
  );
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
  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();
  const createEwallet = useCreateEwallet();
  const updateEwallet = useUpdateEwallet();
  const deleteEwallet = useDeleteEwallet();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingEwalletId, setEditingEwalletId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankFormState>(EMPTY_BANK_FORM);
  const [ewalletForm, setEwalletForm] = useState<EwalletFormState>(EMPTY_EWALLET_FORM);
  const [deleteBank, setDeleteBank] = useState<BankAccountResponse | null>(null);
  const [deleteEwalletTarget, setDeleteEwalletTarget] = useState<EwalletResponse | null>(null);

  const isLoading = segment === "bank" ? banksLoading : ewalletsLoading;

  const openCreate = () => {
    if (segment === "bank") {
      setEditingBankId(null);
      setBankForm(EMPTY_BANK_FORM);
    } else {
      setEditingEwalletId(null);
      setEwalletForm(EMPTY_EWALLET_FORM);
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
    });
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (segment === "bank") {
      if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim() || !bankForm.accountHolderName.trim()) {
        toast.error("Nama bank, no. rekening, dan nama pemilik wajib diisi");
        return;
      }
      const payload = {
        bank_name: bankForm.bankName.trim(),
        account_number: bankForm.accountNumber.trim(),
        account_holder_name: bankForm.accountHolderName.trim(),
      };
      if (editingBankId) {
        updateBankAccount.mutate(
          { id: editingBankId, req: payload },
          {
            onSuccess: () => {
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
    } else {
      if (!ewalletForm.providerName.trim() || !ewalletForm.accountId.trim()) {
        toast.error("Provider dan account ID wajib diisi");
        return;
      }
      const payload = {
        provider_name: ewalletForm.providerName.trim(),
        account_id: ewalletForm.accountId.trim(),
        qr_code_image_url: ewalletForm.qrCodeImageUrl,
      };
      if (editingEwalletId) {
        updateEwallet.mutate(
          { id: editingEwalletId, req: payload },
          {
            onSuccess: () => {
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
    }
  };

  const handleDelete = () => {
    if (deleteBank) {
      deleteBankAccount.mutate(deleteBank.id, {
        onSuccess: () => toast.success("Rekening dihapus"),
        onError: () => toast.error("Gagal menghapus rekening"),
        onSettled: () => setDeleteBank(null),
      });
    } else if (deleteEwalletTarget) {
      deleteEwallet.mutate(deleteEwalletTarget.id, {
        onSuccess: () => toast.success("E-Wallet dihapus"),
        onError: () => toast.error("Gagal menghapus e-wallet"),
        onSettled: () => setDeleteEwalletTarget(null),
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
    updateEwallet.isPending;
  const deletePending = deleteBankAccount.isPending || deleteEwallet.isPending;
  const editingId = segment === "bank" ? editingBankId : editingEwalletId;

  return (
    <div className="space-y-4">
      {/* Alamat pengiriman kado */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="space-y-1.5 p-4">
          <Label htmlFor="shipping-address" className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
        <button
          onClick={() => setSegment("bank")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg transition-all ${
            segment === "bank"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" /> Rekening Bank
        </button>
        <button
          onClick={() => setSegment("ewallet")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg transition-all ${
            segment === "ewallet"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smartphone className="h-4 w-4" /> E-Wallet
        </button>
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
                <div key={account.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => openEditBank(account)} className="min-w-0 text-left">
                      <p className="truncate text-[14px] font-semibold">{account.bank_name}</p>
                      <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground">
                        {account.account_number}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        a.n. {account.account_holder_name}
                      </p>
                    </button>
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={(checked) => handleToggleBank(account, checked)}
                      aria-label="Aktifkan rekening"
                    />
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
                <div key={ewallet.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => openEditEwallet(ewallet)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
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
                        <span className="block truncate text-[14px] font-semibold">{ewallet.provider_name}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                          {ewallet.account_id}
                        </span>
                      </span>
                    </button>
                    <Switch
                      checked={ewallet.is_active}
                      onCheckedChange={(checked) => handleToggleEwallet(ewallet, checked)}
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

      {/* FAB */}
      <button
        onClick={openCreate}
        aria-label={segment === "bank" ? "Tambah rekening" : "Tambah e-wallet"}
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
                    : "Edit E-Wallet"
                  : segment === "bank"
                    ? "Tambah Rekening"
                    : "Tambah E-Wallet"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {segment === "bank" ? (
              <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                <div className="space-y-1.5">
                  <Label htmlFor="bank-name" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Bank</Label>
                  <Input
                    id="bank-name"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="Cth: BCA"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank-number" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nomor Rekening</Label>
                  <Input
                    id="bank-number"
                    inputMode="numeric"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))}
                    placeholder="Cth: 1234567890"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank-holder" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Pemilik</Label>
                  <Input
                    id="bank-holder"
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                    placeholder="Cth: Ramli Pratama"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                <div className="space-y-1.5">
                  <Label htmlFor="ewallet-provider" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Provider</Label>
                  <Input
                    id="ewallet-provider"
                    value={ewalletForm.providerName}
                    onChange={(e) => setEwalletForm((f) => ({ ...f, providerName: e.target.value }))}
                    placeholder="Cth: GoPay / OVO / DANA"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ewallet-account" className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nomor / Account ID</Label>
                  <Input
                    id="ewallet-account"
                    value={ewalletForm.accountId}
                    onChange={(e) => setEwalletForm((f) => ({ ...f, accountId: e.target.value }))}
                    placeholder="Cth: 081234567890"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <MediaInput
                  label="QR Code (Opsional)"
                  value={ewalletForm.qrCodeImageUrl}
                  onChange={(v) => setEwalletForm((f) => ({ ...f, qrCodeImageUrl: v }))}
                  accept="image/*"
                  folder="wedding"
                  preview="image"
                />
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
        open={deleteBank !== null || deleteEwalletTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBank(null);
            setDeleteEwalletTarget(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-[340px] rounded-[2rem] p-6">
          <AlertDialogHeader className="items-center space-y-2 text-center sm:text-center">
            <AlertDialogTitle className="text-base">
              {deleteBank ? "Hapus rekening?" : "Hapus e-wallet?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              {deleteBank
                ? `Rekening ${deleteBank.bank_name} akan dihapus permanen.`
                : `E-Wallet ${deleteEwalletTarget?.provider_name} akan dihapus permanen.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePending}
              className="w-full bg-destructive text-white hover:bg-destructive/90 active:scale-95 transition-all"
            >
              Hapus
            </AlertDialogAction>
            <AlertDialogCancel className="w-full active:scale-95 transition-all">Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
