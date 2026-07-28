"use client"

import { FormEvent, useEffect, useState } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { CatalogProductCard } from "@/components/shop/CatalogProductCard"
import { listCatalog, listCatalogCategories } from "@/lib/api/catalog"
import type { CatalogFilters } from "@/lib/api/catalog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MobileDock } from "@/components/navigation/MobileDock"
import SiteHeader from "@/components/navigation/SiteHeader"

export default function ProductListingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const categoryId = searchParams.get("categoryId") ?? ""
  const sort = (searchParams.get("sort") ?? "newest") as CatalogFilters["sort"]
  const [search, setSearch] = useState(q)
  useEffect(() => setSearch(q), [q])
  const categories = useQuery({ queryKey: ["catalog-categories"], queryFn: listCatalogCategories })
  const products = useInfiniteQuery({
    queryKey: ["catalog", q, categoryId, sort],
    initialPageParam: "" as string,
    queryFn: ({ pageParam }) => listCatalog({
      q: q.length >= 2 ? q : undefined,
      categoryId: categoryId || undefined,
      sort,
      limit: 24,
      cursor: pageParam || undefined,
    }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  })

  function navigate(next: { q?: string; categoryId?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`/products${params.size ? `?${params}` : ""}`)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate({ q: search.trim() })
  }

  const items = products.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="bg-slate-50">
      <SiteHeader />
      <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Jelajahi produk</h1>
        <form onSubmit={submit} className="mt-5 flex gap-2">
          <Input aria-label="Cari produk" placeholder="Cari produk" value={search} onChange={(event) => setSearch(event.target.value)} minLength={2} />
          <Button type="submit">Cari</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          <select aria-label="Kategori" value={categoryId} onChange={(event) => navigate({ categoryId: event.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option value="">Semua kategori</option>
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select aria-label="Urutan" value={sort} onChange={(event) => navigate({ sort: event.target.value })} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga terendah</option>
            <option value="price_desc">Harga tertinggi</option>
            <option value="name_asc">Nama A–Z</option>
          </select>
        </div>
        {products.isPending && <p className="mt-8 text-sm text-slate-600">Memuat produk…</p>}
        {products.isError && <p role="alert" className="mt-8 text-sm text-red-700">Produk gagal dimuat. Coba lagi nanti.</p>}
        {!products.isPending && !products.isError && items.length === 0 && <p className="mt-8 text-sm text-slate-600">Belum ada produk yang cocok.</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => <CatalogProductCard key={product.id} product={product} />)}
        </div>
        {products.hasNextPage && <div className="mt-8 text-center"><Button variant="outline" disabled={products.isFetchingNextPage} onClick={() => products.fetchNextPage()}>{products.isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}</Button></div>}
      </main>
      <MobileDock />
    </div>
  )
}
