import * as React from "react"
import { cn } from "@/src/lib/utils"

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function FeatureCard({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-[var(--color-surface-card)] text-[var(--color-ink)] rounded-xl p-8", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export function ProductMockupCardDark({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)] rounded-xl p-8", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export function CodeWindowCard({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)] rounded-xl p-6", 
        className
      )} 
      {...props}
    >
      <div className="bg-[var(--color-surface-dark-soft)] rounded-lg overflow-hidden border border-border/10">
        {children}
      </div>
    </div>
  )
}

export function CalloutCardCoral({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-primary text-primary-foreground rounded-xl p-8 sm:p-12", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export function HeroBand({ className, children, ...props }: CardProps) {
  return (
    <section 
      className={cn(
        "bg-background text-foreground py-[96px]", 
        className
      )} 
      {...props}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
