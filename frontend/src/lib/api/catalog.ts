import { api } from "./client"

export interface CatalogProduct {
  id: string
  slug: string
  name: string
  description: string | null
  store: {
    id: string
    slug: string
    name: string
    logoUrl: string | null
    logoAltText: string | null
  }
  category: { id: string; name: string } | null
  minPriceAmount: string
  ratingAverage: number
  ratingCount: number
  soldCount: number
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

export interface PublicStore {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  logoAltText: string | null
  status: string
  ratingAverage: number
  ratingCount: number
}

export interface CatalogPage {
  items: CatalogProduct[]
  nextCursor: string | null
}

export interface ProductReview {
  id: string
  productId: string
  orderItemId: string
  rating: number
  comment: string | null
  reviewerName: string
  verifiedPurchase: true
  createdAt: string
  updatedAt: string
}

export interface CatalogFilters {
  q?: string
  categoryId?: string
  storeId?: string
  minPrice?: string
  maxPrice?: string
  minRating?: number
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

export function getProductReviews(productId: string) {
  return api.get<{ items: ProductReview[] }>(
    `/products/${encodeURIComponent(productId)}/reviews`,
  )
}

export function listCatalogCategories() {
  return api.get<CatalogCategory[]>("/categories")
}

export function getPublicStore(slug: string) {
  return api.get<PublicStore>(`/stores/${encodeURIComponent(slug)}`)
}

export function formatRupiah(amount: string) {
  return `Rp ${BigInt(amount).toLocaleString("id-ID")}`
}
