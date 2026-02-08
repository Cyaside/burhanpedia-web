import React from "react"
import { Package, TrendingUp } from "lucide-react"

import { Card } from "@/components/ui/card"

interface SellerDashboardHeaderProps {
  productCount: number
  totalStock: number
}

const SellerDashboardHeader: React.FC<SellerDashboardHeaderProps> = ({ productCount, totalStock }) => (
  <Card className="rounded-2xl border-border/70 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Seller dashboard</p>
        <h2 className="text-2xl font-semibold text-slate-900">Your store performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track listings, stock, and sales activity in real time.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="size-4" /> Products</div>
          <div className="text-xl font-semibold text-slate-900">{productCount}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="size-4" /> Total stock</div>
          <div className="text-xl font-semibold text-slate-900">{totalStock}</div>
        </div>
      </div>
    </div>
  </Card>
)

export default SellerDashboardHeader
