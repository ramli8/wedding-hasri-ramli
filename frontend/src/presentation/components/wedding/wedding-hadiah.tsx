"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";

export function WeddingHadiah() {
  const { data } = useInvitation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  if (!data) return null;

  const { bank_accounts: bankAccounts, ewallets } = data;
  const shippingAddress = data.wedding.gift_shipping_address;
  if (bankAccounts.length === 0 && ewallets.length === 0 && !shippingAddress) {
    return null;
  }

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      haptic(10);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // clipboard tidak tersedia — abaikan
    }
  };

  return (
    <section id="hadiah" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center">
        <WeddingReveal className="wd-section-head">
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">Kirim Hadiah</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)] md:max-w-[30rem]">
            Doa restu Anda adalah hadiah terindah bagi kami. Namun jika memberi adalah
            tanda kasih, kami menerimanya dengan penuh syukur.
          </p>
        </WeddingReveal>

        <div className="grid w-full gap-3 md:grid-cols-2">
          {bankAccounts.map((account) => {
            const key = `${account.bank_name}-${account.account_number}`;
            const copied = copiedKey === key;
            return (
              <WeddingReveal key={key} delay={60}>
                <div className="wd-card flex flex-col gap-3 px-6 py-6 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--wd-card-ink)]/60">
                    {account.bank_name}
                  </p>
                  <p className="wd-display text-[1.75rem] tabular-nums text-[var(--wd-card-ink)]">
                    {account.account_number}
                  </p>
                  <p className="text-[12px] text-[var(--wd-card-ink)]/70">
                    a/n {account.account_holder_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(key, account.account_number)}
                    className="mt-1 inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-[var(--wd-card-ink)]/10 px-4 text-[12px] font-bold text-[var(--wd-card-ink)] transition-all duration-200 active:scale-95"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Tersalin" : "Salin Nomor"}
                  </button>
                </div>
              </WeddingReveal>
            );
          })}

          {ewallets.map((wallet) => (
            <WeddingReveal key={wallet.provider_name} delay={80}>
              <div className="wd-card flex items-center gap-5 px-6 py-6 text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--wd-card-ink)]/10">
                  {wallet.qr_code_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={wallet.qr_code_image_url}
                      alt={`QR ${wallet.provider_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Gift className="h-8 w-8 text-[var(--wd-card-ink)]/40" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--wd-card-ink)]/60">
                    {wallet.provider_name}
                  </p>
                  <p className="truncate text-[14px] font-semibold text-[var(--wd-card-ink)]">
                    {wallet.account_id}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(wallet.provider_name, wallet.account_id)}
                    className="mt-1 inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-[var(--wd-card-ink)]/10 px-4 text-[12px] font-bold text-[var(--wd-card-ink)] transition-all duration-200 active:scale-95"
                  >
                    {copiedKey === wallet.provider_name ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedKey === wallet.provider_name ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>
            </WeddingReveal>
          ))}

          {shippingAddress ? (
            <WeddingReveal delay={100}>
              <div className="flex flex-col gap-1.5 rounded-[1.75rem] border border-[var(--wd-line)] px-6 py-6 text-left">
                <p className="wd-label">Kirim Kado</p>
                <p className="text-[13px] leading-relaxed text-[var(--wd-ink)]/80">
                  {shippingAddress}
                </p>
              </div>
            </WeddingReveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
