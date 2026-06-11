"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        className: "backdrop-blur-xl bg-background/90 border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl",
      }}
      richColors
      {...props}
    />
  )
}

export { Toaster }
