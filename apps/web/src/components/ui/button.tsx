import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-ink text-surface-alt hover:bg-ink-soft",
  secondary: "bg-canvas text-ink hover:bg-hairline",
  outline: "border border-hairline bg-transparent text-ink hover:bg-canvas",
  destructive: "text-ember hover:bg-canvas",
} as const;

export type ButtonVariant = keyof typeof variants;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-2xl px-3 text-body font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
