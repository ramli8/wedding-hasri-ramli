import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function Info() {
  return <SectionShell section={invitationContent.sections.info} />;
}
