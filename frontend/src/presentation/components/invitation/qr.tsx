import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function QrSection() {
  return <SectionShell section={invitationContent.sections.qr} />;
}
