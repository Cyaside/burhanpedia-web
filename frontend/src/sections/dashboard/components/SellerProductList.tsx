import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  name: string
  price: number
  stock: number
  imageUrl: string
}

interface SellerProductListProps {
  products: Product[]
  loading: boolean
}

const SellerProductList: React.FC<SellerProductListProps> = ({ products, loading }) => {
  let content

  if (loading) {
    content = (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-border/60 bg-slate-50 animate-pulse" />
        ))}
      </div>
    )
  } else if (products.length === 0) {
    content = <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">No products added yet.</div>
  } else {
    content = (
      <motion.div
        className="grid gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)" }}
            transition={{ type: "spring", stiffness: 260 }}
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-xl object-cover border border-border/60"
              priority={false}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">{product.name}</div>
                  <div className="text-sm text-muted-foreground">Price: ${product.price}</div>
                </div>
                <Badge variant={product.stock > 0 ? "green" : "red"}>
                  {product.stock > 0 ? "In stock" : "Out of stock"}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Stock: {product.stock}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Your products</h3>
        <span className="text-xs text-muted-foreground">{products.length} items</span>
      </div>
      {content}
    </Card>
  )
}

export default SellerProductList
