"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CatalogProductCard } from "@/components/shop/CatalogProductCard"
import { listCatalog } from "@/lib/api/catalog"

export default function RecommendedProducts() {
  const products = useQuery({
    queryKey: ["home-catalog"],
    queryFn: () => listCatalog({ sort: "newest", limit: 8 }),
  })

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6" id="recommended">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Produk terbaru</h2>
          <p className="mt-1 text-sm text-slate-600">Jelajahi pilihan dari toko Burhanpedia.</p>
        </div>
        <Link href="/products" className="text-sm font-medium text-blue-700 hover:underline">Lihat semua</Link>
      </div>
      {products.isPending && <p className="text-sm text-slate-600">Memuat produk…</p>}
      {products.isError && <p role="alert" className="text-sm text-red-700">Produk belum dapat dimuat.</p>}
      {products.data?.items.length === 0 && <p className="text-sm text-slate-600">Belum ada produk yang tersedia.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.data?.items.map((product) => <CatalogProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
