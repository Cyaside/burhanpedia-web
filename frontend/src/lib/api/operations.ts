import { api } from "./client";
import type { DeliveryMethod } from "./commerce";

export interface SellerOrder {
  id: string;
  number: string;
  status: string;
  totalAmount: string;
  placedAt: string;
  deliveryMethod: DeliveryMethod;
  deliveryDeadlineAt: string;
}

export interface SellerFinance {
  validAmount: string;
  completedAmount: string;
  validCount: string;
  completedCount: string;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  version: number;
  createdAt: string;
  method: DeliveryMethod;
  feeAmount: string;
  pickupDeadlineAt: string;
  deliveryDeadlineAt: string;
  storeName: string;
  city: string;
  province: string;
}

export interface DriverDelivery {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  status: string;
  method: DeliveryMethod;
  feeAmount: string;
  pickupDeadlineAt: string;
  deliveryDeadlineAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  storeName: string;
  city: string;
  province: string;
  jobStatus: string;
  updatedAt: string;
}

export interface DriverEarnings {
  balanceAmount: string;
  currency: string;
  entries: Array<{
    id: string;
    deliveryId: string;
    amount: string;
    earnedAt: string;
  }>;
}

export interface AdminClock {
  now: string;
  offsetSeconds: string;
}

export interface AdminOverview {
  orders: Array<{ status: string; count: string }>;
  deliveries: Array<{ status: string; count: string }>;
  jobs: Array<{ status: string; count: string }>;
  outbox: Array<{ status: string; count: string }>;
  deadLetterCount: number;
  vouchers: Array<{
    id: string;
    code: string;
    name: string;
    kind: "FIXED" | "PERCENTAGE" | "FREE_SHIPPING";
    valueAmount: string | null;
    valueBasisPoints: number | null;
    minimumSubtotalAmount: string;
    quota: number | null;
    redemptionCount: number;
    perBuyerLimit: number;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
  }>;
}

export const operationsApi = {
  sellerOrders: () => api.get<SellerOrder[]>("/seller/orders"),
  sellerFinance: () => api.get<SellerFinance>("/seller/orders/finance"),
  processSellerOrder: (orderId: string) =>
    api.post<{ id: string; status: string }>(`/seller/orders/${orderId}/process`),
  jobs: (cursor?: string) =>
    api.get<{ data: DeliveryJob[]; nextCursor: string | null }>(
      `/driver/jobs?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  driverDeliveries: () => api.get<DriverDelivery[]>("/driver/deliveries"),
  claimJob: (jobId: string, idempotencyKey: string) =>
    api.post<{ status: string; id: string; delivery_id: string; order_id: string }>(
      `/driver/jobs/${jobId}/claim`,
      undefined,
      { headers: { "Idempotency-Key": idempotencyKey } },
    ),
  pickup: (deliveryId: string) =>
    api.post<{ id: string; status: string }>(`/driver/deliveries/${deliveryId}/pickup`),
  completeDelivery: (deliveryId: string) =>
    api.post<{ id: string; status: string; earningAmount: string }>(
      `/driver/deliveries/${deliveryId}/complete`,
    ),
  earnings: () => api.get<DriverEarnings>("/driver/earnings"),
  clock: () => api.get<AdminClock>("/admin/clock"),
  advanceClock: (days: number) => api.post<AdminClock>("/admin/clock/advance", { days }),
  adminOverview: () => api.get<AdminOverview>("/admin/operations"),
  createVoucher: (input: {
    code: string;
    name: string;
    kind: "FIXED" | "PERCENTAGE" | "FREE_SHIPPING";
    valueAmount?: string;
    valueBasisPoints?: number;
    maximumDiscountAmount?: string;
    minimumSubtotalAmount: string;
    quota?: number;
    perBuyerLimit: number;
    startsAt: string;
    endsAt: string;
  }) => api.post("/admin/vouchers", input),
};
