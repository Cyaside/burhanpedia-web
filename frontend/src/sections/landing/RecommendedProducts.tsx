import React, { JSX, useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "./components/ProductCard"
import { getApiUrl } from "@/lib/config"

interface Product {
  id: number
  name: string
  price: number
  imageUrl: string
  seller?: { name?: string }
  description?: string
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 280, damping: 24 } },
}

const skeletonArray = Array.from({ length: 8 }).map((_, i) => i)

export default function RecommendedProducts(): JSX.Element {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(getApiUrl("/products/recommended"), { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Product[]
        setProducts(data)
      } catch (err: unknown) {
        if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError") return
        console.error("Error fetching recommended products:", err)
        setError("Unable to load recommendations. Please try again.")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value)
  }

  return (
    <section className="section-padding section-space" id="recommended">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Recommended</p>
            <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">Recommended for you</h2>
            <p className="mt-2 text-sm text-muted-foreground">A personalized mix of trending and top-rated products.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="green">Personalized</Badge>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {loading && (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {skeletonArray.map((i) => (
              <motion.div key={i} variants={itemVariants} className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
                <div className="h-36 w-full rounded-xl bg-slate-100 animate-pulse" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && products && products.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-sm text-muted-foreground">
            No recommendations available right now.
          </div>
        )}

        {!loading && products && products.length > 0 && (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} formatCurrency={formatCurrency} itemVariants={itemVariants} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
