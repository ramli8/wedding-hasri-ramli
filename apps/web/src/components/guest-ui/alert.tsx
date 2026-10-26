import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

/** `error` memakai merah (alert); `info` tetap hitam putih. */
export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 border-2 bg-paper px-3 py-2 text-sm ${tone === "error" ? "border-alert text-alert" : "border-ink text-ink"}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
