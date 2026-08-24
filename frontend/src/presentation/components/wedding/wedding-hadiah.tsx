"use client";

import { useState } from "react";
import { Check, Copy, ScanLine } from "lucide-react";
import { toast } from "react-toastify";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/src/presentation/components/ui/drawer";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import type { InvitationEwallet } from "@/src/domain/services/invitation.service";
import { WeddingReveal } from "./wedding-reveal";
import { getGiftBrand } from "@/src/lib/invitation/gift-logos";
import { haptic } from "@/src/lib/invitation/haptics";

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
  if (!data) return null;

  const { bank_accounts: bankAccounts, ewallets } = data;
  const shippingAddress = data.wedding.gift_shipping_address;
  if (bankAccounts.length === 0 && ewallets.length === 0 && !shippingAddress) {
    return null;
  }

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
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Tanda Kasih
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kirim Hadiah</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[30rem]">
            Doa restu Anda adalah hadiah terindah bagi kami. Namun jika memberi adalah
            tanda kasih, kami menerimanya dengan penuh syukur.
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
      </div>

      {/* Bottom sheet QR — warna literal karena portal berada di luar scope .wedding. */}
      <style jsx global>{`
        .wd-qr-sheet {
          background-color: #17171a;
          color: #f4f4f4;
          border: 1px solid rgba(244, 244, 244, 0.12);
          border-bottom: none;
        }
        .wd-qr-sheet > div:first-child {
          background: rgba(244, 244, 244, 0.25);
          margin-top: 0.875rem;
        }
      `}</style>
      <Drawer shouldScaleBackground={false} open={qrWallet !== null} onOpenChange={(open) => !open && setQrWallet(null)}>
        <DrawerContent className="wd-qr-sheet fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[1.75rem]">
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
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8e8e93]">
                    a.n Hasri &amp; Ramli
                  </p>
                </div>
                <p className="max-w-[17rem] text-center text-[12px] leading-relaxed text-[#8e8e93]">
                  Screenshot kode ini, lalu pindai melalui aplikasi e-wallet Anda.
                </p>
                <a
                  href={qrWallet.qr_code_image_url ?? "#"}
                  download={`qris-hasri-ramli.png`}
                  onClick={() => haptic(8)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ece9e2] text-[12px] font-bold tracking-wide text-[#141413] transition-all duration-200 active:scale-[0.98]"
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
