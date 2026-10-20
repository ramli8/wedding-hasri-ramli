import type { ReactNode } from "react";

/** `error` memakai merah (ember); `info` tetap monokrom. */
export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl px-3 py-2 text-body ${tone === "error" ? "bg-canvas text-ember" : "bg-canvas text-ink-soft"}`}
    >
      {children}
    </p>
  );
}
