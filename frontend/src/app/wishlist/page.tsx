"use client"

import { useEffect } from "react"
import { useWishlistStore } from "@/store/wishlist"
import { ProductCard } from "@/components/shop/ProductCard"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"
import { useAuthGuard } from "@/lib/auth"

export default function WishlistPage() {
  const { items, load } = useWishlistStore()
  const { token, checking } = useAuthGuard()

  useEffect(() => {
    if (token) load()
  }, [load, token])

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
      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Wishlist</p>
            <h1 className="text-2xl font-semibold text-foreground">Saved items</h1>
          </div>
          <span className="text-sm text-muted-foreground">{items.length} items</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No saved items yet.</p>}
        </div>
      </main>
      <MobileDock />
    </div>
  )
}
