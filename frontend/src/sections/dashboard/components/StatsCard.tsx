import React from "react"
import { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: string
}

export default function StatsCard({ label, value, icon: Icon, tone }: StatsCardProps) {
  return (
    <Card className={cn("flex items-center justify-between rounded-2xl border-border/70 bg-white p-5 shadow-sm", tone)}>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
        <Icon className="size-5" />
      </div>
    </Card>
  )
}
