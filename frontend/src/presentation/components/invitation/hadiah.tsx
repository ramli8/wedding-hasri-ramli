import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function Hadiah() {
  return <SectionShell section={invitationContent.sections.hadiah} />;
}
