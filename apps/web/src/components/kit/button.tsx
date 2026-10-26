import type * as React from "react";
import { buttonVariants, Button as ShadcnButton } from "@/components/ui/button";

export { buttonVariants };

/**
 * Button shadcn-admin apa adanya, hanya `type="button"` jadi bawaan: tombol di dalam <form>
 * tidak boleh mengirim formulir kecuali diminta (`type="submit"`).
 */
export function Button({ type = "button", ...props }: React.ComponentProps<typeof ShadcnButton>) {
  return <ShadcnButton type={type} {...props} />;
}
