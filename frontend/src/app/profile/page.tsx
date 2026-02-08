"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchOrders, fetchWishlist } from "@/lib/api/shop"
import { Badge } from "@/components/ui/badge"
import { MobileDock } from "@/components/navigation/MobileDock"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, Package, UserRound } from "lucide-react"
import SiteHeader from "@/components/navigation/SiteHeader"

export default function ProfilePage() {
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders })
  const { data: wishlist = [] } = useQuery({ queryKey: ["wishlist"], queryFn: fetchWishlist })

  return (
    <div className="bg-background">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
            <h1 className="text-2xl font-semibold text-foreground">Your account</h1>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Orders</h2>
              </div>
              <Badge variant="default">{orders.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Order #{order.id}</span>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                  <p className="text-muted-foreground">Total {order.total.toLocaleString("id-ID")}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Wishlist</h2>
              </div>
              <Badge variant="default">{wishlist.length}</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {wishlist.length === 0 && <p className="text-sm text-muted-foreground">No wishlist items.</p>}
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-muted-foreground">{item.category?.name}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/products/${item.slug}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <MobileDock />
    </div>
  )
}
