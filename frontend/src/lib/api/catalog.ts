import { api } from "./client"

export interface CatalogProduct {
  id: string
  slug: string
  name: string
  description: string | null
  store: { id: string; slug: string; name: string }
  category: { id: string; name: string } | null
  minPriceAmount: string
  ratingAverage: number
  ratingCount: number
  availableQuantity: number
  images: { url: string; alt: string }[]
  variants: {
    id: string
    name: string
    attributes: Record<string, unknown>
    priceAmount: string
    availableQuantity: number
  }[]
  createdAt: string
}

export interface CatalogCategory {
  id: string
  slug: string
  name: string
  parentId: string | null
}

export interface CatalogPage {
  items: CatalogProduct[]
  nextCursor: string | null
}

export interface CatalogFilters {
  q?: string
  categoryId?: string
  storeId?: string
  minPrice?: string
  maxPrice?: string
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc"
  cursor?: string
  limit?: number
}

export function listCatalog(filters: CatalogFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value))
  })
  const query = params.toString()
  return api.get<CatalogPage>(`/products${query ? `?${query}` : ""}`)
}

export function getCatalogProduct(id: string) {
  return api.get<CatalogProduct>(`/products/${encodeURIComponent(id)}`)
}

export function listCatalogCategories() {
  return api.get<CatalogCategory[]>("/categories")
}

export function formatRupiah(amount: string) {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`
}
