import { api } from "./client"
import {
  Product,
  CartItem,
  Order,
  Address,
  WalletTransaction,
  SellerTransaction,
  SellerOrderItem,
} from "@/types/shop"

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

export function fetchWalletTransactions() {
  return api.get<WalletTransaction[]>("/wallet/transactions")
}

export function topUpWallet(payload: { amount: number; note?: string }) {
  return api.post<{ balance: number; transaction: WalletTransaction }>("/wallet/topup", payload)
}

export function fetchSellerBalance() {
  return api.get<{ balance: number }>("/seller/balance")
}

export function fetchSellerTransactions() {
  return api.get<SellerTransaction[]>("/seller/transactions")
}

export function fetchSellerOrders() {
  return api.get<SellerOrderItem[]>("/seller/orders")
}
