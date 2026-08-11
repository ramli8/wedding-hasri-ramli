import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function KisahCinta() {
  return <SectionShell section={invitationContent.sections["kisah-cinta"]} />;
}
