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
      <div className="wd-container flex flex-col items-center gap-10 text-center md:max-w-[36rem]">
        <WeddingReveal className="wd-section-head">
          <p className="wd-script text-[2rem] text-[var(--wd-ink)]/70 md:text-[2.5rem]">
            Seputar Acara
          </p>
          <h2 className="wd-display text-[2.25rem] md:text-[3rem]">FAQ</h2>
          <p className="max-w-[24rem] text-[13px] leading-relaxed text-[var(--wd-muted)]">
            Beberapa hal yang mungkin ingin Anda ketahuan sebelum hari bahagia.
          </p>
        </WeddingReveal>

        <WeddingReveal delay={80} className="w-full">
          <div className="flex flex-col divide-y divide-[var(--wd-line)] border-y border-[var(--wd-line)] text-left">
            {faqs.map((faq, index) => {
              const open = openIndex === index;
              const questionId = `faq-question-${index}`;
              const answerId = `faq-answer-${index}`;
              return (
                <div key={`${faq.question}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(6);
                      setOpenIndex(open ? null : index);
                    }}
                    aria-expanded={open}
                    aria-controls={answerId}
                    className={cn(
                      "-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 px-3 py-5 text-left transition-colors duration-200",
                      open ? "bg-white/[0.03]" : "hover:bg-white/[0.02]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "wd-display w-7 shrink-0 pt-0.5 text-[1.15rem] leading-none tabular-nums transition-colors duration-300",
                        open ? "text-[var(--wd-accent)]" : "text-[var(--wd-muted)]",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                        open
                          ? "rotate-45 border-[var(--wd-accent-line)] bg-[var(--wd-accent-soft)] text-[var(--wd-accent)]"
                          : "border-[var(--wd-line-strong)] text-[var(--wd-muted)]",
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 pl-11 pr-9 text-[13px] leading-relaxed text-[var(--wd-muted)]">
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
