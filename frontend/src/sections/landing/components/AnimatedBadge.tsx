import React from "react"
import { Sparkles } from "lucide-react"

export default function AnimatedBadge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset animate-in fade-in zoom-in duration-500 " +
        colorClass
      }>
      <Sparkles className="size-3" />
      {text}
    </span>
  )
}


