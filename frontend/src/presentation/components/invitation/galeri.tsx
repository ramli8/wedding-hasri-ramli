import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function Galeri() {
  return <SectionShell section={invitationContent.sections.galeri} />;
}
