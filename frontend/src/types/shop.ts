export interface Category {
  id: number
  name: string
  slug: string
  icon?: string | null
}

export interface ProductImage {
  id: number
  url: string
  isPrimary?: boolean
}

export interface ProductVariant {
  id: number
  color?: string | null
  size?: string | null
  sku?: string | null
  stock: number
  priceDelta?: number | null
}

export interface Product {
  id: number
  slug: string
  name: string
  description?: string
  price: number
  stock: number
  imageUrl?: string
  ratingAvg?: number | null
  ratingCount?: number | null
  category?: Category | null
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export interface Review {
  id: number
  rating: number
  comment?: string
  createdAt: string
  buyer?: { name?: string }
}

export interface CartItem {
  id: number
  productId: number
  variantId?: number | null
  quantity: number
  unitPrice: number
  product: Product
  variant?: ProductVariant | null
}

export interface OrderItem {
  id: number
  productId: number
  variantId?: number | null
  quantity: number
  unitPrice: number
  product: Product
}

export interface Address {
  id: number
  label: string
  recipient: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  province: string
  postalCode: string
  isDefault?: boolean
}

export interface Order {
  id: number
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  total: number
  subTotal: number
  shippingFee: number
  discount?: number | null
  createdAt: string
  items: OrderItem[]
  address?: Address | null
}

export interface WalletTransaction {
  id: number
  type: string
  amount: number
  note?: string | null
  createdAt: string
}

export interface SellerTransaction {
  id: number
  sellerId: number
  orderId?: number | null
  amount: number
  type: string
  note?: string | null
  createdAt: string
}

export interface SellerOrderItem {
  id: number
  orderId: number
  quantity: number
  unitPrice: number
  product: Product
  variant?: ProductVariant | null
  order?: {
    id: number
    createdAt: string
    buyer?: { user?: { name?: string; email?: string } }
  }
}
