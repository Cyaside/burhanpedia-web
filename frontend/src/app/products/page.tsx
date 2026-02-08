import React, { Suspense } from "react"
import ProductListingClient from "./ProductListingClient"

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading products...</div>}>
      <ProductListingClient />
    </Suspense>
  )
}
