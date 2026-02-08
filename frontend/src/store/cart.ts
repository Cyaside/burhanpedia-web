import { create } from "zustand"
import { CartItem } from "@/types/shop"
import { addToCart, fetchCart, removeCart, updateCart } from "@/lib/api/shop"

interface CartState {
  items: CartItem[]
  loading: boolean
  error?: string | null
  load: () => Promise<void>
  add: (payload: { productId: number; variantId?: number | null; quantity?: number }) => Promise<void>
  update: (id: number, quantity: number) => Promise<void>
  remove: (id: number) => Promise<void>
  clearError: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  load: async () => {
    set({ loading: true, error: null })
    try {
      const items = await fetchCart()
      set({ items })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load cart" })
    } finally {
      set({ loading: false })
    }
  },
  add: async (payload) => {
    set({ error: null })
    try {
      await addToCart(payload)
      await get().load()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add to cart" })
    }
  },
  update: async (id, quantity) => {
    set({ error: null })
    try {
      await updateCart(id, { quantity })
      await get().load()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update cart" })
    }
  },
  remove: async (id) => {
    set({ error: null })
    try {
      await removeCart(id)
      set({ items: get().items.filter((i) => i.id !== id) })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to remove item" })
    }
  },
}))

