import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { Eye, ShoppingCart } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  slug?: string
  name: string
  price: number
  imageUrl: string
  seller?: { name?: string }
  description?: string
}

interface ProductCardProps {
  readonly product: Product
  readonly formatCurrency: (value: number) => string
  readonly itemVariants: Variants
}

export function ProductCard({ product: p, formatCurrency, itemVariants }: ProductCardProps) {
  return (
    <motion.div key={p.id} variants={itemVariants} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}>
      <Card className="group flex h-full flex-col overflow-hidden border-border/60 bg-white shadow-sm">
        <div className="relative">
          <Image
            src={p.imageUrl}
            alt={p.name}
            width={400}
            height={240}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = "/images/fallback-product.png"
            }}
          />
          <Badge variant="blue" className="absolute left-3 top-3">Trending</Badge>
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{p.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Seller: {p.seller?.name ?? "Unknown"}</p>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(p.price)}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href={p.slug ? `/products/${p.slug}` : "#"}>
                <Eye className="size-4" />
                View
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="text-xs text-muted-foreground">In stock</div>
          <Button size="sm" className="gap-2">
            <ShoppingCart className="size-4" />
            Add
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
