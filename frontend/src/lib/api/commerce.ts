import { api } from "./client";

export type DeliveryMethod = "INSTANT" | "NEXT_DAY" | "REGULAR";

interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceAmount: string;
  lineTotalAmount: string;
  availableQuantity: number;
  variantName: string;
  product: { id: string; name: string; imageUrl: string | null };
}

interface CartGroup {
  id: string;
  name: string;
  items: CartItem[];
  subtotalAmount: string;
}

export interface Cart {
  id: string | null;
  version: number;
  groups: CartGroup[];
  subtotalAmount: string;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CreateAddressInput {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface CheckoutInput {
  addressId: string;
  voucherCode?: string;
  deliveries: Array<{ storeId: string; method: DeliveryMethod }>;
}

export interface PriceQuote {
  stores: Array<{
    storeId: string;
    subtotalAmount: string;
    discountAmount: string;
    shippingAmount: string;
    totalAmount: string;
  }>;
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount: string;
  totalAmount: string;
}

export interface CheckoutResult extends PriceQuote {
  id: string;
  createdAt: string;
  orders: Array<{
    id: string;
    number: string;
    status: string;
    storeId: string;
    totalAmount: string;
  }>;
}

export interface OrderSummary {
  id: string;
  number: string;
  status: string;
  totalAmount: string;
  placedAt: string;
  storeName: string;
  deliveryMethod: DeliveryMethod;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    variantName: string;
    review: {
      rating: number;
      comment: string | null;
      updatedAt: string;
    } | null;
  }>;
}

export interface OrderDetail {
  id: string;
  number: string;
  status: string;
  subtotalAmount: string;
  discountAmount: string;
  shippingAmount: string;
  totalAmount: string;
  placedAt: string;
  storeName: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPriceAmount: string;
    lineTotalAmount: string;
  }>;
  address: {
    recipientName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string;
  };
  history: Array<{ from: string | null; to: string; reason: string | null; createdAt: string }>;
  deliveryHistory: Array<{ from: string | null; to: string; note: string | null; occurredAt: string }>;
}

export interface WalletHistory {
  balanceAmount: string;
  items: Array<{
    id: string;
    type: string;
    amountDelta: string;
    balanceAfter: string;
    description: string | null;
    createdAt: string;
  }>;
  nextCursor: string | null;
}

export const commerceApi = {
  cart: () => api.get<Cart>("/cart"),
  addItem: (variantId: string, quantity = 1) =>
    api.post<Cart>("/cart/items", { variantId, quantity }),
  updateItem: (id: string, quantity: number) =>
    api.patch<Cart>(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) => api.del<void>(`/cart/items/${id}`),
  addresses: () => api.get<Address[]>("/addresses"),
  createAddress: (input: CreateAddressInput) =>
    api.post<Address>("/addresses", input),
  quote: (input: CheckoutInput) =>
    api.post<PriceQuote>("/checkout/quote", input),
  checkout: (input: CheckoutInput, idempotencyKey: string) =>
    api.post<CheckoutResult>("/checkouts", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
  orders: () => api.get<OrderSummary[]>("/orders"),
  order: (orderId: string) => api.get<OrderDetail>(`/orders/${orderId}`),
  completeOrder: (orderId: string) => api.post<{ id: string; status: string }>(`/orders/${orderId}/complete`),
  saveReview: (
    orderId: string,
    orderItemId: string,
    input: { rating: number; comment?: string },
  ) =>
    api.put(`/orders/${orderId}/items/${orderItemId}/review`, input),
  wallet: () => api.get<WalletHistory>("/wallet/entries"),
  demoTopUp: (amount: number, idempotencyKey: string) =>
    api.post("/wallet/top-ups", { amount }, {
      headers: { "Idempotency-Key": idempotencyKey },
    }),
};

export function formatMoney(amount: string): string {
  return `Rp ${BigInt(amount).toLocaleString("id-ID")}`;
}
