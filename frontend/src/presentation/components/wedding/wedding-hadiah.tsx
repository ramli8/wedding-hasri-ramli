"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Gift, ScanLine } from "lucide-react";
import { toast } from "react-toastify";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/presentation/components/ui/drawer";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type {
  InvitationEwallet,
  InvitationWishlistItem,
} from "@/src/domain/services/invitation.service";
import { WeddingReveal } from "./wedding-reveal";
import { getGiftBrand } from "@/src/lib/invitation/gift-logos";
import { haptic } from "@/src/lib/invitation/haptics";

const WISHLIST_CLAIMS_KEY = "wd-wishlist-claims";

function readMyClaims(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_CLAIMS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function BrandChip({ name }: { name: string }) {
  const brand = getGiftBrand(name);
  const fontSize = Math.min(12, Math.floor(36 / brand.label.length) + 5);
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg px-0.5 text-center font-extrabold uppercase leading-none tracking-tight"
      style={{ backgroundColor: brand.bg, color: brand.fg, fontSize }}
    >
      {brand.label}
    </span>
  );
}

export function WeddingHadiah() {
  const { data } = useInvitation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrWallet, setQrWallet] = useState<InvitationEwallet | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [myClaims, setMyClaims] = useState<string[]>(readMyClaims);
  if (!data) return null;

  const { bank_accounts: bankAccounts, ewallets, wishlist } = data;
  const shippingAddress = data.wedding.gift_shipping_address;
  if (
    bankAccounts.length === 0 &&
    ewallets.length === 0 &&
    !shippingAddress &&
    wishlist.length === 0
  ) {
    return null;
  }

  const claimItem = (item: InvitationWishlistItem) => {
    const next = Array.from(new Set([...myClaims, item.item_name]));
    setMyClaims(next);
    try {
      window.localStorage.setItem(WISHLIST_CLAIMS_KEY, JSON.stringify(next));
    } catch {
      // storage penuh / diblokir — klaim tetap tampil di sesi ini
    }
    haptic(10);
    toast.success(`Terima kasih! "${item.item_name}" sudah kami catat atas nama Anda.`);
  };

  const handleCopy = async (
    key: string,
    value: string,
    successMessage: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      haptic(10);
      setCopiedKey(key);
      toast.success(successMessage);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      toast.error("Gagal menyalin. Silakan salin manual.");
    }
  };

  const copyButtonClass = (copied: boolean) =>
    `inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
      copied
        ? "border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] text-[var(--wd-accent)]"
        : "border-[var(--wd-line-strong)] text-[var(--wd-muted)] hover:text-[var(--wd-ink)]"
    }`;

  return (
    <section id="hadiah" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-10 text-center">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kirim Hadiah</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[30rem]">
            Doa restu Anda adalah hadiah terindah bagi kami.
          </p>
        </WeddingReveal>

        {bankAccounts.length > 0 ? (
          <WeddingReveal delay={60} className="w-full max-w-md">
            <div className="flex w-full items-center gap-4">
              <p className="wd-label shrink-0">Transfer Bank</p>
              <span className="wd-hairline-t w-full" aria-hidden />
            </div>
            <div className="wd-glass mt-4 flex flex-col px-5 py-1 sm:px-6">
              <ul className="divide-y divide-[var(--wd-line)]">
                {bankAccounts.map((account) => {
                  const key = `${account.bank_name}-${account.account_number}`;
                  const copied = copiedKey === key;
                  return (
                    <li key={key} className="flex items-center gap-3.5 py-4">
                      <BrandChip name={account.bank_name} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-left text-[14px] font-semibold">
                          {account.bank_name}
                        </p>
                        <p className="truncate text-left text-[12px] text-[var(--wd-muted)]">
                          a/n {account.account_holder_name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <p className="wd-display whitespace-nowrap text-[1.2rem] leading-none tabular-nums tracking-wide">
                          {account.account_number}
                        </p>
                        <button
                          type="button"
                          aria-label={`Salin nomor rekening ${account.bank_name}`}
                          onClick={() =>
                            handleCopy(key, account.account_number, "Nomor rekening tersalin")
                          }
                          className={copyButtonClass(copied)}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </WeddingReveal>
        ) : null}

        {ewallets.length > 0 ? (
          <WeddingReveal delay={80} className="w-full max-w-md">
            <div className="flex w-full items-center gap-4">
              <p className="wd-label shrink-0">E-Wallet</p>
              <span className="wd-hairline-t w-full" aria-hidden />
            </div>
            <div className="wd-glass mt-4 flex flex-col px-5 py-1 sm:px-6">
              <ul className="divide-y divide-[var(--wd-line)]">
                {ewallets.map((wallet) => {
                  const copied = copiedKey === wallet.provider_name;
                  const hasQr = Boolean(wallet.qr_code_image_url);
                  return (
                    <li key={wallet.provider_name} className="flex items-center gap-3.5 py-4">
                      {wallet.qr_code_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={wallet.qr_code_image_url}
                          alt={`QR ${wallet.provider_name}`}
                          className="h-11 w-11 shrink-0 rounded-lg border border-white/20 bg-white object-cover"
                        />
                      ) : (
                        <BrandChip name={wallet.provider_name} />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-[14px] font-semibold">
                          {wallet.provider_name}
                        </p>
                        <p className="truncate text-[12px] tabular-nums text-[var(--wd-muted)]">
                          {wallet.account_id}
                        </p>
                      </div>
                      {hasQr ? (
                        <button
                          type="button"
                          aria-label={`Pindai QR ${wallet.provider_name}`}
                          onClick={() => {
                            haptic(8);
                            setQrWallet(wallet);
                          }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] text-[var(--wd-accent)] transition-all duration-200 active:scale-90"
                        >
                          <ScanLine className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Salin ID ${wallet.provider_name}`}
                          onClick={() =>
                            handleCopy(
                              wallet.provider_name,
                              wallet.account_id.replace(/\s+/g, ""),
                              `${wallet.provider_name} ID tersalin`,
                            )
                          }
                          className={copyButtonClass(copied)}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </WeddingReveal>
        ) : null}

        {shippingAddress ? (
          <WeddingReveal delay={100} className="w-full max-w-md">
            <div className="flex w-full items-center gap-4">
              <p className="wd-label shrink-0">Kirim Kado Fisik</p>
              <span className="wd-hairline-t w-full" aria-hidden />
            </div>
            <div className="mt-4 flex w-full items-start gap-4 rounded-2xl border border-[var(--wd-line)] px-5 py-4 text-left">
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--wd-ink)]/80">
                {shippingAddress}
              </p>
              <button
                type="button"
                aria-label="Salin alamat pengiriman"
                onClick={() =>
                  handleCopy("address", shippingAddress, "Alamat pengiriman tersalin")
                }
                className={copyButtonClass(copiedKey === "address")}
              >
                {copiedKey === "address" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </WeddingReveal>
        ) : null}

        {wishlist.length > 0 ? (
          <WeddingReveal delay={120} className="w-full max-w-md">
            <button
              type="button"
              onClick={() => {
                haptic(8);
                setWishlistOpen(true);
              }}
              aria-haspopup="dialog"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--wd-line-strong)] px-6 text-[12px] font-bold tracking-wide transition-all duration-200 hover:border-[var(--wd-accent-line)] active:scale-[0.98]"
            >
              <Gift className="h-4 w-4 text-[var(--wd-accent)]" aria-hidden />
              Lihat Wishlist
            </button>
          </WeddingReveal>
        ) : null}
      </div>

      <Drawer
        shouldScaleBackground={false}
        open={wishlistOpen}
        onOpenChange={setWishlistOpen}
      >
        <DrawerContent className="wd-sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem]">
          <div className="overflow-y-auto px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex flex-col items-center gap-1 pb-5">
              <DrawerTitle className="text-xl font-light [font-family:var(--font-cormorant),serif]">
                Wishlist Kami
              </DrawerTitle>
              <DrawerDescription className="max-w-full text-center text-[11px] uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                Pilih yang ingin Anda berikan
              </DrawerDescription>
            </div>

            <ul className="flex flex-col gap-2.5">
              {wishlist.map((item) => {
                const stockTotal = item.stock_total ?? 1;
                const baseClaimed =
                  item.claimed_count ?? (item.is_claimed ? 1 : 0);
                const mine = myClaims.includes(item.item_name);
                const hasClaimed = myClaims.length > 0;
                const claimed = Math.min(baseClaimed + (mine ? 1 : 0), stockTotal);
                const soldOut = claimed >= stockTotal;
                return (
                  <li
                    key={item.item_name}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]"
                    >
                      <Gift className="h-5 w-5 text-[var(--sheet-accent)]/70" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold leading-tight">
                        {item.item_name}
                      </p>
                      <div
                        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={stockTotal}
                        aria-valuenow={claimed}
                        aria-label={`Stok ${item.item_name}`}
                      >
                        <div
                          className="h-full rounded-full bg-[var(--sheet-accent)]"
                          style={{ width: `${(claimed / stockTotal) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--sheet-muted)]">
                        {claimed} dari {stockTotal} sudah dipilih
                      </p>
                      {item.item_link ? (
                        <a
                          href={item.item_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--sheet-muted)] underline decoration-white/20 underline-offset-2 transition-colors duration-200 hover:text-[var(--sheet-accent)]"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden />
                          Lihat referensi produk
                        </a>
                      ) : null}
                    </div>
                    {mine ? (
                      <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--sheet-accent-line)] px-3 text-[11px] font-bold text-[var(--sheet-accent)]">
                        <Check className="h-3 w-3" aria-hidden />
                        Dipilihmu
                      </span>
                    ) : soldOut ? (
                      <span className="inline-flex h-9 shrink-0 items-center rounded-full border border-white/10 px-3 text-[11px] font-bold text-[var(--sheet-muted)] opacity-60">
                        Habis
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => claimItem(item)}
                        disabled={hasClaimed}
                        title={
                          hasClaimed
                            ? "Satu tamu hanya bisa memilih satu hadiah"
                            : undefined
                        }
                        className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--sheet-accent)] px-4 text-[11px] font-bold tracking-wide text-[var(--sheet-on-accent)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                      >
                        {hasClaimed ? "Kuota Terpakai" : "Klaim"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--sheet-muted)]/80">
              Satu tamu hanya dapat memilih satu hadiah — supaya stok tercatat adil untuk tamu lain.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer shouldScaleBackground={false} open={qrWallet !== null} onOpenChange={(open) => !open && setQrWallet(null)}>
        <DrawerContent className="wd-sheet fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[1.75rem]">
          <div className="flex flex-col items-center gap-4 px-6 pb-[calc(2.25rem+env(safe-area-inset-bottom))] pt-2">
            <DrawerTitle className="sr-only">Kode QR {qrWallet?.provider_name}</DrawerTitle>
            <DrawerDescription className="sr-only">
              Pindai atau simpan kode QR untuk pembayaran
            </DrawerDescription>

            {qrWallet ? (
              <>
                <div className="rounded-2xl bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrWallet.qr_code_image_url ?? ""}
                    alt={`QR ${qrWallet.provider_name}`}
                    className="h-auto w-[min(64vw,240px)] rounded-md"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[15px] font-semibold">{qrWallet.provider_name}</p>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--sheet-muted)]">
                    a.n Hasri &amp; Ramli
                  </p>
                </div>
                <p className="max-w-[17rem] text-center text-[12px] leading-relaxed text-[var(--sheet-muted)]">
                  Screenshot kode ini, lalu pindai melalui aplikasi e-wallet Anda.
                </p>
                <a
                  href={qrWallet.qr_code_image_url ?? "#"}
                  download={`qris-hasri-ramli.png`}
                  onClick={() => haptic(8)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--sheet-accent)] text-[12px] font-bold tracking-wide text-[var(--sheet-on-accent)] transition-all duration-200 active:scale-[0.98]"
                >
                  Simpan Gambar QR
                </a>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
