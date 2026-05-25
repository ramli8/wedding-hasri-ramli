import * as React from "react"
import { cn } from "@/src/lib/utils"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  children: React.ReactNode
}

export function DisplayXL({ as: Component = "h1", className, ...props }: TypographyProps) {
  return <Component className={cn("text-display-xl", className)} {...props} />
}

export function DisplayLG({ as: Component = "h2", className, ...props }: TypographyProps) {
  return <Component className={cn("text-display-lg", className)} {...props} />
}

export function DisplayMD({ as: Component = "h3", className, ...props }: TypographyProps) {
  return <Component className={cn("text-display-md", className)} {...props} />
}

export function DisplaySM({ as: Component = "h4", className, ...props }: TypographyProps) {
  return <Component className={cn("text-display-sm", className)} {...props} />
}

export function TitleLG({ as: Component = "h4", className, ...props }: TypographyProps) {
  return <Component className={cn("text-title-lg", className)} {...props} />
}

export function TitleMD({ as: Component = "h5", className, ...props }: TypographyProps) {
  return <Component className={cn("text-title-md", className)} {...props} />
}

export function TitleSM({ as: Component = "h6", className, ...props }: TypographyProps) {
  return <Component className={cn("text-title-sm", className)} {...props} />
}

export function BodyMD({ as: Component = "p", className, ...props }: TypographyProps) {
  return <Component className={cn("text-body-md", className)} {...props} />
}

export function BodySM({ as: Component = "p", className, ...props }: TypographyProps) {
  return <Component className={cn("text-body-sm", className)} {...props} />
}

export function Caption({ as: Component = "span", className, ...props }: TypographyProps) {
  return <Component className={cn("text-caption", className)} {...props} />
}

export function CaptionUppercase({ as: Component = "span", className, ...props }: TypographyProps) {
  return <Component className={cn("text-caption-uppercase", className)} {...props} />
}

export function CodeText({ as: Component = "code", className, ...props }: TypographyProps) {
  return <Component className={cn("text-code", className)} {...props} />
}
