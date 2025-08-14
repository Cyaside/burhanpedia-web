import * as React from "react"

import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blue" | "red" | "green" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const stylesByVariant: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-secondary text-secondary-foreground ring-1 ring-border",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    red: "bg-red-50 text-red-700 ring-1 ring-red-200",
    green: "bg-green-50 text-green-700 ring-1 ring-green-200",
    outline: "ring-1 ring-border",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        stylesByVariant[variant],
        className
      )}
      {...props}
    />
  )
}


