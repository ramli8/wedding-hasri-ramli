"use client";

import type { InvitationSection } from "@/src/domain/services/invitation-content";
import { Reveal } from "@/src/lib/invitation/reveal";

type SectionShellProps = {
  section: InvitationSection;
};

export function SectionShell({ section }: SectionShellProps) {
  return (
    <section
      id={section.id}
      className="inv-section inv-hairline-b relative flex min-h-dvh items-center justify-center border-b px-6 py-24"
    >
      <Reveal className="text-center">
        <p className="inv-label">{section.number}</p>
        <h2 className="inv-display mt-4 text-5xl sm:text-6xl">{section.label}</h2>
      </Reveal>
    </section>
  );
}
