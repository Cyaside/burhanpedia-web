import { create } from "zustand"
import { Product } from "@/types/shop"
import { fetchWishlist, toggleWishlist } from "@/lib/api/shop"

interface WishlistState {
  items: Product[]
  loading: boolean
  error?: string | null
  load: () => Promise<void>
  toggle: (productId: number) => Promise<void>
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null })
    try {
      const items = await fetchWishlist()
      set({ items })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load wishlist" })
    } finally {
      set({ loading: false })
    }
  },
  toggle: async (productId) => {
    try {
      await toggleWishlist(productId)
      const exists = get().items.some((i) => i.id === productId)
      if (exists) {
        set({ items: get().items.filter((i) => i.id !== productId) })
      } else {
        await get().load()
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update wishlist" })
    }
  },
}))

