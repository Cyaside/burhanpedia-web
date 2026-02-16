"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useCartStore } from "@/store/cart"
import { useQuery } from "@tanstack/react-query"
import { fetchAddresses, createOrder } from "@/lib/api/shop"
import { Address } from "@/types/shop"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"
import { useAuthGuard } from "@/lib/auth"

export default function CheckoutPage() {
  const { items, load } = useCartStore()
  const [addressId, setAddressId] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { token, checking } = useAuthGuard()

  useEffect(() => {
    if (token) load()
  }, [load, token])

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
    enabled: !!token,
  })

  useEffect(() => {
    if (addresses.length && !addressId) {
      setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id)
    }
  }, [addresses, addressId])

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const shipping = subtotal > 0 ? 20000 : 0
  const total = subtotal + shipping

  async function handlePlaceOrder() {
    if (!addressId) return
    setPlacing(true)
    setErrorMessage(null)
    try {
      const order = await createOrder({ addressId })
      setOrderId(order.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place order"
      setErrorMessage(message)
    } finally {
      setPlacing(false)
    }
  }

  const success = orderId !== null

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  if (!token) {
    return null
  }

  return (
    <div className="bg-background">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Checkout</p>
            <h1 className="text-2xl font-semibold text-foreground">Review & pay</h1>
          </div>
          <Badge variant="default">{items.length} items</Badge>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Shipping address</h2>
              <RadioGroup value={addressId?.toString()} onValueChange={(v) => setAddressId(Number(v))} className="mt-4 space-y-3">
                {addresses.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Add an address first in{" "}
                    <Link href="/profile" className="underline">
                      profile
                    </Link>
                    .
                  </p>
                )}
                {addresses.map((addr) => (
                  <label key={addr.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3">
                    <RadioGroupItem value={addr.id.toString()} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{addr.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.recipient} • {addr.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.province}, {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Payment</h2>
              <p className="mt-2 text-sm text-muted-foreground">Cashless simulated checkout. Marked as paid automatically.</p>
            </section>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
              {success && <Badge variant="green" className="gap-1"><CheckCircle className="size-4" />Placed</Badge>}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total)}
                </span>
              </div>
            </div>
            <Button className="mt-4 w-full rounded-full" disabled={!addressId || placing || success} onClick={handlePlaceOrder}>
              {success ? "Order placed" : placing ? "Processing..." : "Place order"}
            </Button>
            {errorMessage && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{errorMessage}</p>
                {errorMessage.toLowerCase().includes("balance") && (
                  <Link href="/dashboard" className="underline">
                    Top up your balance in the dashboard
                  </Link>
                )}
              </div>
            )}
            <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
              <Link href="/cart">Back to cart</Link>
            </Button>
          </div>
        </div>
      </main>
      <MobileDock />
    </div>
  )
}
