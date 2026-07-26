"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cart"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"
import { useAuthGuard } from "@/lib/auth"

export default function CartPage() {
  const { items, load, update, remove, loading } = useCartStore()
  const { isAuthenticated, checking } = useAuthGuard()

  useEffect(() => {
    if (isAuthenticated) void load()
  }, [load, isAuthenticated])

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const shipping = subtotal > 0 ? 20000 : 0
  const total = subtotal + shipping

  return (
    <div className="bg-background">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cart</p>
            <h1 className="text-2xl font-semibold text-foreground">Your bag</h1>
          </div>
          <Badge variant="default">{items.length} items</Badge>
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading cart...</p>}

        {!loading && items.length === 0 && (
          <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
            Your cart is empty. <Link href="/products" className="text-primary underline">Browse products</Link>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <Image
                  src={item.product.images?.[0]?.url || "/images/fallback-product.png"}
                  alt={item.product.name}
                  width={120}
                  height={120}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">
                          {item.variant.color} {item.variant.size}
                        </p>
                      )}
                    </div>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(item.id)}>
                      <Trash className="size-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.unitPrice)}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-2 py-1">
                    <button
                      onClick={() => update(item.id, Math.max(1, item.quantity - 1))}
                      className="rounded-full p-1 hover:bg-muted"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="px-2 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => update(item.id, item.quantity + 1)}
                      className="rounded-full p-1 hover:bg-muted"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? "Free" : shipping.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total)}
                </span>
              </div>
            </div>
            <Button asChild className="mt-4 w-full rounded-full">
              <Link href="/checkout">Go to checkout</Link>
            </Button>
          </div>
        </div>
      </main>
      <MobileDock />
    </div>
  )
}
