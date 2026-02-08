import { api } from "./client"
import { Product, CartItem, Order, Address } from "@/types/shop"

export function fetchProducts(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, String(value))
  })
  const qs = query.toString()
  return api.get<Product[]>(`/products${qs ? `?${qs}` : ""}`)
}

export function fetchProduct(slug: string) {
  return api.get<Product>(`/products/${slug}`)
}

export function fetchCart() {
  return api.get<CartItem[]>("/cart")
}

export function addToCart(payload: { productId: number; variantId?: number | null; quantity?: number }) {
  return api.post<CartItem>("/cart", payload)
}

export function updateCart(id: number, payload: { quantity: number }) {
  return api.patch<CartItem>(`/cart/${id}`, payload)
}

export function removeCart(id: number) {
  return api.del<{ success: boolean }>(`/cart/${id}`)
}

export function fetchWishlist() {
  return api.get<Product[]>("/wishlist")
}

export function toggleWishlist(productId: number) {
  return api.post<{ success: boolean }>("/wishlist", { productId })
}

export function fetchAddresses() {
  return api.get<Address[]>("/addresses")
}

export function createOrder(payload: { addressId: number }) {
  return api.post<Order>("/checkout", payload)
}

export function fetchOrders() {
  return api.get<Order[]>("/orders")
}

