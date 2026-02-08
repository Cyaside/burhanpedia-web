"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { fetchProduct } from "@/lib/api/shop"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingBag, ShoppingCart, Star } from "lucide-react"
import { ProductVariant } from "@/types/shop"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const addToCart = useCartStore((s) => s.add)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
  })
  const product = data
  const [activeImage, setActiveImage] = useState(0)
  const [variantId, setVariantId] = useState<number | undefined>(undefined)

  const variants = useMemo(() => product?.variants ?? [], [product])

  if (!isLoading && error) {
    return notFound()
  }

  if (!product) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
          Loading product...
        </div>
      </div>
    )
  }

  const price = product.price + (variants.find((v) => v.id === variantId)?.priceDelta || 0)

  return (
    <div className="bg-background">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
              <Image
                src={product.images?.[activeImage]?.url || product.imageUrl || "/images/fallback-product.png"}
                alt={product.name}
                width={960}
                height={960}
                className="h-[420px] w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {(product.images || []).map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-xl border ${activeImage === i ? "border-primary" : "border-border/70"}`}
                >
                  <Image src={img.url} alt={product.name} width={160} height={160} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category?.name ?? "Product"}</p>
                <h1 className="text-3xl font-semibold text-foreground">{product.name}</h1>
                {product.ratingAvg && (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-foreground">
                    <Star className="size-3.5 text-amber-400" />
                    {product.ratingAvg.toFixed(1)} ({product.ratingCount ?? 0})
                  </div>
                )}
              </div>
              <button
                aria-label="Wishlist"
                className="rounded-full border border-border/70 p-2 text-muted-foreground hover:text-primary"
                onClick={() => toggleWishlist(product.id)}
              >
                <Heart className="size-5" />
              </button>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-3xl font-semibold text-foreground">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price)}
              </p>
              {product.stock < 5 && <Badge variant="red">Low stock</Badge>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description ?? "Carefully curated product for you."}</p>

            {variants.length > 0 && (
              <VariantSelector variants={variants} active={variantId} onSelect={setVariantId} />
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="gap-2 rounded-full px-6"
                onClick={() => addToCart({ productId: product.id, variantId, quantity: 1 })}
              >
                <ShoppingCart className="size-4" />
                Add to cart
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-full px-6"
                onClick={() => {
                  addToCart({ productId: product.id, variantId, quantity: 1 })
                  router.push("/checkout")
                }}
              >
                <ShoppingBag className="size-4" />
                Buy now
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Shipping</p>
              <p className="text-sm text-muted-foreground">Estimated delivery in 2-4 days • Free returns within 7 days</p>
            </div>
          </div>
        </div>
      </main>
      <MobileDock />
    </div>
  )
}

function VariantSelector({
  variants,
  active,
  onSelect,
}: {
  variants: ProductVariant[]
  active?: number
  onSelect: (id: number | undefined) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Choose a variant</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              active === v.id ? "border-primary bg-primary/5 text-primary" : "border-border/70 text-foreground"
            }`}
          >
            {[v.color, v.size].filter(Boolean).join(" • ") || "Default"}
          </button>
        ))}
        {variants.length > 0 && (
          <button
            onClick={() => onSelect(undefined)}
            className={`rounded-full border px-4 py-2 text-sm ${
              !active ? "border-primary bg-primary/5 text-primary" : "border-border/70 text-foreground"
            }`}
          >
            Any
          </button>
        )}
      </div>
    </div>
  )
}
