import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function Penutup() {
  return <SectionShell section={invitationContent.sections.penutup} />;
}
