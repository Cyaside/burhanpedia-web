import Image from "next/image"
import Link from "next/link"
import { Heart, Star, ShoppingCart } from "lucide-react"
import { Product } from "@/types/shop"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWishlistStore } from "@/store/wishlist"
import { useRouter } from "next/navigation"
import { requireAuth } from "@/lib/auth"

interface Props {
  product: Product
  onAdd?: (productId: number) => void
}

export function ProductCard({ product, onAdd }: Props) {
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const router = useRouter()

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block">
        <Image
          src={product.images?.[0]?.url || product.imageUrl || "/images/fallback-product.png"}
          alt={product.name}
          width={480}
          height={360}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {product.ratingAvg ? (
          <Badge className="absolute left-3 top-3 bg-white/90 text-foreground shadow-sm">
            <Star className="mr-1 size-4 text-amber-400" />
            {product.ratingAvg?.toFixed(1)}
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-foreground">
              {product.name}
            </Link>
            {product.category && <p className="text-xs text-muted-foreground">{product.category.name}</p>}
          </div>
          <button
            className="rounded-full border border-border/70 p-1.5 text-muted-foreground hover:text-primary"
            aria-label="Toggle wishlist"
            onClick={() => {
              if (!requireAuth(router)) return
              void toggleWishlist(product.id)
            }}
          >
            <Heart className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-semibold text-foreground">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.price)}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => {
              if (!requireAuth(router)) return
              onAdd?.(product.id)
            }}
          >
            <ShoppingCart className="size-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
