"use client"

import React, { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { CreditCard, Gift, UserRound, Wallet } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchWalletTransactions, topUpWallet } from "@/lib/api/shop"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Coupon {
  id: number
  code: string
  discount: string
  expiry: string
}

interface BuyerDashboardProps {
  name: string
  email: string
  profileImage?: string
  balance: number
  coupons: Coupon[]
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  name,
  email,
  profileImage,
  balance,
  coupons,
}) => {
  const [currentBalance, setCurrentBalance] = useState(balance)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [topUpError, setTopUpError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setCurrentBalance(balance)
  }, [balance])

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: fetchWalletTransactions,
  })

  const topUpMutation = useMutation({
    mutationFn: (payload: { amount: number; note?: string }) => topUpWallet(payload),
    onSuccess: (data) => {
      setCurrentBalance(data.balance)
      setAmount("")
      setNote("")
      setTopUpError(null)
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] })
    },
    onError: (err) => {
      setTopUpError(err instanceof Error ? err.message : "Failed to top up")
    },
  })

  const formatCurrency = useMemo(
    () => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }),
    []
  )

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || Number.isNaN(value) || value <= 0) {
      setTopUpError("Amount must be greater than 0")
      return
    }
    topUpMutation.mutate({ amount: value, note: note || undefined })
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-600">
                {typeof name === "string" && name.length > 0 ? name.charAt(0) : "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-emerald-600" />
              Verified buyer profile
            </div>
            <div className="flex items-center gap-2">
              <Gift className="size-4 text-blue-600" />
              {coupons.length} coupons available
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="size-4 text-emerald-600" />
            Balance
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">{formatCurrency.format(currentBalance)}</div>
          <p className="mt-2 text-xs text-muted-foreground">Available to spend on your next purchase.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Coupons</h3>
          <span className="text-xs text-muted-foreground">{coupons.length} active</span>
        </div>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-xl border border-border/60 bg-emerald-50 px-4 py-4">
                <div className="text-xs text-emerald-700">Code</div>
                <div className="text-lg font-semibold text-emerald-800">{coupon.code}</div>
                <div className="mt-2 text-sm text-emerald-700">Discount: {coupon.discount}</div>
                <div className="text-xs text-emerald-600">Expires: {coupon.expiry}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4 text-emerald-600" />
            Top up balance
          </div>
          <form onSubmit={handleTopUp} className="grid gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Top up for shopping"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={topUpMutation.isPending} className="mt-2 w-full gap-2">
              {topUpMutation.isPending ? "Processing..." : "Top up balance"}
            </Button>
            {topUpError && <p className="text-sm text-destructive">{topUpError}</p>}
          </form>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Wallet transactions</h3>
            <span className="text-xs text-muted-foreground">{transactions.length} entries</span>
          </div>
          {loadingTransactions ? (
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.note || "Wallet activity"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="text-right font-semibold text-slate-900">{formatCurrency.format(tx.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyerDashboard
