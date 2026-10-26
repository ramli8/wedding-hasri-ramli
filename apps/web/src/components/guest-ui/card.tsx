import type { HTMLAttributes } from "react";

const tones = {
  paper: "bg-paper text-ink",
  acid: "bg-acid text-ink",
  ink: "bg-ink text-bone",
} as const;

const shadows = {
  md: "shadow-hard",
  lg: "shadow-hard-lg",
  none: "",
} as const;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof tones;
  shadow?: keyof typeof shadows;
};

export function Card({ tone = "paper", shadow = "md", className = "", ...props }: CardProps) {
  return (
    <div
      className={`card border-2 border-ink p-5 ${tones[tone]} ${shadows[shadow]} ${className}`}
      {...props}
    />
  );
}
