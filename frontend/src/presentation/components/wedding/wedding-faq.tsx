"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useInvitation } from "@/src/application/hooks/use-invitation-query";
import { WeddingReveal } from "./wedding-reveal";
import { haptic } from "@/src/lib/invitation/haptics";
import { cn } from "@/src/lib/utils";

export function WeddingFaq() {
  const { data } = useInvitation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!data) return null;

  const faqs = data.faqs;
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="wd-section">
      <div className="wd-container flex flex-col items-center gap-8 text-center md:max-w-[36rem]">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            good to know
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">FAQ</h2>
        </WeddingReveal>

        <WeddingReveal delay={80} className="w-full">
          <div className="flex flex-col divide-y divide-[var(--wd-line)] border-y border-[var(--wd-line)] text-left">
            {faqs.map((faq, index) => {
              const open = openIndex === index;
              return (
                <div key={`${faq.question}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(6);
                      setOpenIndex(open ? null : index);
                    }}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors"
                  >
                    <span className="text-[14px] font-semibold">{faq.question}</span>
                    <Plus
                      className={cn(
                        "h-4 w-4 shrink-0 text-[var(--wd-muted)] transition-transform duration-200",
                        open && "rotate-45",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-[13px] leading-relaxed text-[var(--wd-muted)]">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WeddingReveal>
      </div>
    </section>
  );
}
