"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Product } from "@/types/shop"
import { fetchProducts } from "@/lib/api/shop"
import { ProductCard } from "@/components/shop/ProductCard"
import { FilterDrawer } from "@/components/shop/FilterDrawer"
import { Button } from "@/components/ui/button"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"
import { useCartStore } from "@/store/cart"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const mockCategories = [
  { label: "All", value: "" },
  { label: "Electronics", value: "electronics" },
  { label: "Fashion", value: "fashion" },
  { label: "Home", value: "home" },
  { label: "Beauty", value: "beauty" },
]

export default function ProductListingPage() {
  const params = useSearchParams()
  const initialQuery = params.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2_000_000])
  const addToCart = useCartStore((s) => s.add)

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ["products", query, category, rating, priceRange],
    queryFn: () =>
      fetchProducts({
        q: query || undefined,
        category: category || undefined,
        rating: rating || undefined,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
      }),
  })

  const products = useMemo(() => data ?? [], [data])

  return (
    <div className="bg-background">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Browse</p>
            <h1 className="text-2xl font-semibold text-foreground">Products</h1>
            {query && <p className="text-sm text-muted-foreground">Results for “{query}”</p>}
          </div>
          <div className="flex items-center gap-2">
            <FilterDrawer
              categories={mockCategories.filter((c) => c.value)}
              selectedCategory={category}
              onCategoryChange={setCategory}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              rating={rating}
              onRatingChange={setRating}
            />
            <Button variant="ghost" className="rounded-full" onClick={() => setQuery("")}>Clear</Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
          <Button size="sm" className="rounded-full px-4" onClick={() => setQuery(query.trim())}>
            Apply
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to load products.
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl border border-border/60 bg-card shadow-sm animate-pulse" />
            ))}
          {!isLoading && products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={(id) => addToCart({ productId: id, quantity: 1 })}
            />
          ))}
        </div>
      </main>
      <MobileDock />
    </div>
  )
}
