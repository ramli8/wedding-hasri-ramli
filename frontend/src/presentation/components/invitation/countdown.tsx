import { SectionShell } from "./section-shell";
import { invitationContent } from "@/src/domain/services/invitation-content";

export function Countdown() {
  return <SectionShell section={invitationContent.sections.countdown} />;
}
