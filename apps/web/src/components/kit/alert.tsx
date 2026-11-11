import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { AlertDescription, Alert as ShadcnAlert } from "@/components/ui/alert";

/** Alert shadcn-admin: `error` memakai varian destructive, `info` varian bawaan. */
export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    // `data-form-error`: di dalam dialog, galat yang muncul setelah Simpan digulir ke tengah lembar.
    <ShadcnAlert
      variant={tone === "error" ? "destructive" : "default"}
      data-form-error={tone === "error" ? "" : undefined}
    >
      <Icon />
      <AlertDescription>{children}</AlertDescription>
    </ShadcnAlert>
  );
}
